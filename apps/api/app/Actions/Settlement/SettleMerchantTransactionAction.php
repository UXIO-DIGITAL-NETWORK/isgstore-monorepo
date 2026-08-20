<?php

declare(strict_types=1);

namespace App\Actions\Settlement;

use App\Actions\Notification\NotifyPaymentInternalAction;
use App\Models\BalanceMutation;
use App\Models\Transaction;
use App\Support\Ledger\PlatformLedger;
use App\Support\Wallet\WalletLedger;
use Illuminate\Support\Facades\DB;

/**
 * Splits a paid transaction between the merchant ("client") and the platform
 * ("kita"), once, when payment is confirmed.
 *
 *   - the merchant is credited `amount_base` (their product's net price);
 *   - the platform keeps the admin fee net of Monetapay's real fee, i.e.
 *     `amount_fee - payments.gateway_fee`.
 *
 * Only merchant-attributed transactions settle here — platform-owned sales
 * (merchant_id = null, e.g. the original top-up catalogue) are left untouched,
 * so this is additive to the existing checkout flow.
 *
 * Idempotent: a `settlement` balance mutation keyed on the invoice number is
 * the marker. A retried Monetapay webhook (or a re-run from the balance path)
 * therefore credits exactly once.
 */
class SettleMerchantTransactionAction
{
    public function execute(Transaction $transaction): void
    {
        $merchantId = $transaction->merchant_id;

        // Platform-owned sale: nothing to settle to a client.
        if (! $merchantId) {
            return;
        }

        $reference = $transaction->invoice_number;
        $settled = false;

        DB::transaction(function () use ($transaction, $merchantId, $reference, &$settled) {
            // Idempotency guard under the transaction: if the settlement credit
            // already exists for this invoice, a second delivery is a no-op.
            $alreadySettled = BalanceMutation::query()
                ->where('type', 'settlement')
                ->where('reference', $reference)
                ->exists();

            if ($alreadySettled) {
                return;
            }
            $settled = true;

            $amountBase = (int) $transaction->amount_base;
            // Read `amount_fee`, never `channel_fee`. They are equal for rows
            // written since the global markup was removed, but historical rows
            // split into channel_fee + admin_markup — swapping the column here
            // would silently under-report profit already booked to the ledger.
            $adminFee = (int) $transaction->amount_fee;
            $gatewayFee = (int) ($transaction->payment?->gateway_fee ?? 0);

            // Credit the merchant their net sale price.
            if ($amountBase > 0) {
                WalletLedger::record(
                    user: $merchantId,
                    amount: $amountBase,
                    type: 'settlement',
                    reference: $reference,
                    description: "Penjualan {$reference}",
                );
            }

            // Keep kita's admin fee net of Monetapay's actual fee. Can be zero
            // (or negative if the gateway fee exceeds it); only a non-zero
            // movement is recorded, since a ledger entry of 0 is meaningless.
            $platformProfit = $adminFee - $gatewayFee;
            if ($platformProfit !== 0) {
                PlatformLedger::record(
                    amount: $platformProfit,
                    type: 'markup',
                    reference: $reference,
                    description: "Markup admin fee {$reference}",
                );
            }
        });

        // After commit and only on a real (non-duplicate) settlement: alert the
        // internal team that a client transaction came in.
        if ($settled) {
            $merchantName = $transaction->merchant?->name ?? "Client #{$merchantId}";
            app(NotifyPaymentInternalAction::class)->execute(
                type: 'transaction_sale',
                title: 'Transaksi masuk',
                message: "Transaksi masuk dari {$merchantName} — {$reference} Rp ".number_format((int) $transaction->amount_base),
                data: [
                    'invoice_number' => $reference,
                    'merchant_id' => $merchantId,
                    'amount' => (int) $transaction->amount_base,
                ],
            );
        }
    }
}
