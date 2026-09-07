<?php

declare(strict_types=1);

namespace App\Actions\Refund;

use App\Actions\Log\CreateActivityLogAction;
use App\Actions\Settlement\ReverseMerchantSettlementAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\DTOs\Refund\CompleteRefundDTO;
use App\Enums\PaymentStatus;
use App\Enums\RefundMethod;
use App\Enums\RefundStatus;
use App\Enums\TransactionStatus;
use App\Models\RefundRequest;
use App\Models\User;
use App\Support\Wallet\WalletLedger;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * The single "the money has moved" verb for a guest refund, and the one moment
 * everything downstream of cash out happens at once:
 *
 *   - `payments.status` → REFUNDED. **The invariant is that this column flips
 *     exactly when the credit happens** — at initiation on the member path,
 *     here on every guest path. The finance reports read it as cash out, so
 *     flipping it when the refund was merely *requested* would report money
 *     that is still sitting in the account, potentially for months now that
 *     unclaimed refunds never expire;
 *   - `transactions.status` → REFUNDED;
 *   - the merchant settlement is un-booked;
 *   - the customer is told.
 *
 * Two shapes, branching on the method:
 *
 *   - `BALANCE_CLAIM` — the guest came back with an account and an admin has
 *     verified it. The balance is credited here, **inside the same DB
 *     transaction** as the status flip, through `WalletLedger`. No bank
 *     account, no transfer proof.
 *   - `MANUAL_TRANSFER` — the retired path. An admin has made a bank transfer
 *     by hand and is recording it, with the destination and the receipt.
 *
 * Deliberately one endpoint rather than a separate `verify-credit`: the claim
 * lock, `refunded_at`, the two status flips and the settlement reversal are all
 * keyed to this action, and a second writer of COMPLETED would have to
 * reproduce every one of them — and be re-covered by every guard test.
 *
 * Only the admin holding the row may complete it.
 */
class CompleteRefundRequestAction
{
    public function __construct(
        private readonly ReverseMerchantSettlementAction $reverseSettlement,
        private readonly SendRefundCompletedNotificationAction $notification,
        private readonly CreateActivityLogAction $activityLogAction,
    ) {}

    public function execute(RefundRequest $refund, User $admin, CompleteRefundDTO $dto): RefundRequest
    {
        $fresh = DB::transaction(function () use ($refund, $admin, $dto) {
            /** @var RefundRequest $locked */
            $locked = RefundRequest::with(['transaction.payment'])
                ->whereKey($refund->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            if (! in_array($locked->status, [RefundStatus::PENDING, RefundStatus::PROCESSING], true)) {
                throw new RuntimeException('Refund ini sudah diselesaikan atau ditolak.');
            }

            // Someone else opened their banking app for this row. Make them
            // talk to each other rather than both press send.
            if ($locked->processed_by !== null && $locked->processed_by !== $admin->id) {
                throw new RuntimeException('Refund ini sedang diproses oleh admin lain.');
            }

            // The money-moved marker, checked alongside the status rather than
            // instead of it. The status guard above already serialises two
            // concurrent completes; this is the assertion that actually says
            // "no balance has been credited for this refund yet", and it is why
            // WalletLedger needs no idempotency key of its own — the refund row
            // *is* the key.
            if ($locked->refunded_at !== null) {
                throw new RuntimeException('Refund ini sudah dibayarkan.');
            }

            if ($locked->requiresPayoutDetails() && ! $locked->hasPayoutDetails()) {
                throw new RuntimeException('Rekening tujuan belum diisi.');
            }

            if ($locked->method === RefundMethod::BALANCE_CLAIM) {
                $this->creditClaimedAccount($locked);
            }

            $locked->update([
                'status' => RefundStatus::COMPLETED,
                'processed_by' => $admin->id,
                'processed_at' => $locked->processed_at ?? now(),
                'proof_path' => $dto->proofPath ?? $locked->proof_path,
                'admin_note' => $dto->note ?? $locked->admin_note,
                'refunded_at' => now(),
            ]);

            // The money is out: the payment is no longer collected revenue and
            // the order is terminally refunded.
            $locked->transaction?->payment?->update(['status' => PaymentStatus::REFUNDED]);
            $locked->transaction?->update(['status' => TransactionStatus::REFUNDED]);

            return $locked->fresh(['transaction.payment']);
        });

        // ── Post-commit: bookkeeping and notifications, neither of which may
        // undo a transfer that has already happened in the real world. ──
        $this->reverseSettlement->execute($fresh);
        $this->notification->execute($fresh);

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: $admin->id,
            ipAddress: request()->ip() ?? '127.0.0.1',
            userAgent: request()->userAgent(),
            message: "Admin menyelesaikan refund {$fresh->refund_number} sebesar Rp ".number_format((int) $fresh->amount),
            transactionId: $fresh->transaction_id,
        ));

        return $fresh;
    }

    /**
     * Credit the account a guest claimed this refund with.
     *
     * Runs inside the caller's transaction on purpose: the credit and the
     * status flip must commit or roll back together, or a crash between them
     * leaves either money handed out for a refund still shown as owed, or a
     * refund marked paid that never paid. `WalletLedger::record` opens its own
     * transaction, which nests as a savepoint — the member path in
     * `InitiateRefundAction` already relies on exactly this.
     *
     * Lock order is refund → user, and the user row is taken last everywhere in
     * the codebase (`InitiateRefundAction` takes transaction → user, checkout
     * takes user first and nothing after). Do not lock the claimant early "to
     * validate": that inverts the order and opens a deadlock against checkout.
     */
    private function creditClaimedAccount(RefundRequest $locked): void
    {
        if ($locked->claimed_user_id === null) {
            throw new RuntimeException('Refund ini belum diklaim dengan sebuah akun.');
        }

        $claimant = User::whereKey($locked->claimed_user_id)->lockForUpdate()->first();

        // `claimed_user_id` is restrictOnDelete, so this should be unreachable.
        // It is checked anyway because the alternative is WalletLedger's
        // firstOrFail() throwing ModelNotFoundException from inside the
        // transaction and surfacing to the admin as a 500 instead of a 422.
        if (! $claimant) {
            throw new RuntimeException('Akun pengklaim sudah tidak ada.');
        }

        // Crediting an account that cannot spend turns a refund into a
        // liability that never discharges, and the customer would be told they
        // were paid. Make the admin unblock the account or reject the claim.
        if ($claimant->status !== 'active') {
            throw new RuntimeException('Akun pengklaim sedang tidak aktif. Aktifkan akun atau tolak klaim ini.');
        }

        $invoice = $locked->transaction?->invoice_number ?? $locked->refund_number;

        // Guarded on zero: an order paid entirely with points owes no cash
        // back, and WalletLedger refuses a zero mutation.
        if ((int) $locked->amount > 0) {
            WalletLedger::record(
                user: $claimant->id,
                amount: (int) $locked->amount,
                type: 'refund',
                reference: $invoice,
                description: "Refund {$invoice}",
            );
        }

        // Guests cannot spend points, so a claimed refund should never carry
        // any. Assert it rather than silently crediting a stranger's account.
        if ((int) $locked->points_amount > 0) {
            throw new RuntimeException('Refund ini membawa poin, yang tidak mungkin untuk pembelian tamu.');
        }
    }
}
