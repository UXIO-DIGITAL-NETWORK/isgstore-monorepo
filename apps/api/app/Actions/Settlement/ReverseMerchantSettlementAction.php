<?php

declare(strict_types=1);

namespace App\Actions\Settlement;

use App\Models\BalanceMutation;
use App\Models\PlatformMutation;
use App\Models\RefundRequest;
use App\Services\DiscordWebhookService;
use App\Support\Wallet\WalletLedger;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

/**
 * The mirror of SettleMerchantTransactionAction: un-books a sale once its money
 * has actually gone back to the customer.
 *
 * Called at the moment the refund settles — inline for a member's wallet
 * credit, on `complete` for a guest's manual transfer. Never at request time: a
 * REJECTED guest refund must leave the merchant's settlement intact.
 *
 * **Only the merchant's leg moves**, and only `amount_base`. A refund returns
 * the product price alone (`InitiateRefundAction`) — the channel fee stays with
 * the platform — so the platform's books are already correct: it keeps
 * `admin_fee` and it paid `gateway_fee + tax_amount`, exactly what settlement
 * booked as profit. Reversing the markup here and then re-booking the gateway
 * cost would net to `-admin_fee`, charging the platform for a fee it never gave
 * back. **Do not re-add a platform leg without changing what the refund pays.**
 *
 * The one leg is the merchant's wallet mirror (`users.balance`), best-effort.
 * The merchant's *withdrawable* balance is derived by `MerchantBalance` from
 * `transactions.status`, so it already corrects itself the moment the order
 * leaves `paidStates()`. This leg exists only so `balance_mutations` — what the
 * merchant actually reads — tells the same story.
 *
 * Should a platform leg ever be needed again it must be typed `markup` with a
 * negative amount, **not** a new `*_reversal` type: `PlatformBalance::income()`
 * whitelists `['markup','withdrawal_fee','service_revenue']` and would silently
 * ignore anything else, leaving kita's withdrawable balance inflated.
 *
 * Every reversal leg references `RFD-{invoice}` rather than the bare invoice
 * number: `SettleMerchantTransactionAction` guards idempotency on
 * `(type: settlement, reference: invoice)`, and a reversal sharing that key
 * would confuse a re-delivered PAID webhook.
 *
 * **This must never be able to fail a refund.** `WalletLedger` throws when a
 * balance would go negative, which is the normal outcome when the merchant has
 * spent what it was credited. The failure is reported and swallowed; the
 * customer is made whole either way and the shortfall is chased out of band.
 */
class ReverseMerchantSettlementAction
{
    public function __construct(private readonly DiscordWebhookService $discord) {}

    /**
     * @return bool True when the books are square (reversed now, already
     *              reversed, or nothing to reverse); false when a leg failed.
     */
    public function execute(RefundRequest $refund): bool
    {
        $refund->loadMissing(['transaction']);
        $transaction = $refund->transaction;

        if (! $transaction) {
            return true;
        }

        $reference = 'RFD-'.$transaction->invoice_number;
        $merchantId = $refund->merchant_id ?? $transaction->merchant_id;

        if ($refund->settlement_reversed_at !== null) {
            return true;
        }

        $walletFailure = null;

        try {
            DB::transaction(function () use ($refund, $transaction, $merchantId, $reference, &$walletFailure) {
                // Idempotency marker that survives a crash between the ledger
                // write and the timestamp: the mutation this action leaves
                // behind. Both tables are checked — legacy reversals (which
                // booked platform legs) are recognised by the platform row,
                // current ones by the merchant's.
                $alreadyReversed = PlatformMutation::query()
                    ->where('reference', $reference)
                    ->exists()
                    || BalanceMutation::query()
                        ->where('reference', $reference)
                        ->exists();

                if ($alreadyReversed) {
                    $refund->forceFill(['settlement_reversed_at' => now()])->save();

                    return;
                }

                $amountBase = (int) $transaction->amount_base;

                // ── The merchant's wallet mirror (best effort) ───────────────
                if ($merchantId && $amountBase > 0) {
                    try {
                        WalletLedger::record(
                            user: $merchantId,
                            amount: -$amountBase,
                            type: 'settlement_reversal',
                            reference: $reference,
                            description: "Pembatalan penjualan (refund) {$transaction->invoice_number}",
                        );
                    } catch (RuntimeException $e) {
                        // Merchant already spent it. Books stay short by
                        // amount_base until it is chased manually — but the
                        // customer's refund is not held hostage to that.
                        $walletFailure = $e->getMessage();
                    }
                }

                $refund->forceFill(['settlement_reversed_at' => now()])->save();
            });
        } catch (Throwable $e) {
            Log::error("Settlement reversal failed for {$reference}: {$e->getMessage()}");

            $this->discord->sendAlert(
                "**Pembalikan settlement gagal** — refund `{$refund->refund_number}` "
                ."(invoice `{$transaction->invoice_number}`) sudah dibayarkan ke pelanggan, "
                ."tetapi pembukuannya tidak bisa dibalik: {$e->getMessage()}"
            );

            return false;
        }

        if ($walletFailure !== null) {
            $this->discord->sendAlert(
                "**Saldo merchant tidak bisa dipotong** pada refund `{$refund->refund_number}` "
                ."(invoice `{$transaction->invoice_number}`): {$walletFailure}\n"
                .'Pembukuan platform sudah dibalik; tagih selisihnya ke merchant secara manual.'
            );

            return false;
        }

        return true;
    }
}
