<?php

namespace App\Actions\Uxiotopup;

use App\Actions\Log\CreateActivityLogAction;
use App\Actions\Payment\RefundFailedTransactionAction;
use App\Actions\Transaction\SendTransactionReceiptAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Enums\TransactionStatus;
use App\Models\Transaction;
use App\Services\CustomerNumberFormatter;
use App\Services\DiscordWebhookService;
use App\Traits\MapsUxiotopupStatus;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class HandleUxiotopupWebhookAction
{
    use MapsUxiotopupStatus;

    public function __construct(
        private readonly CreateActivityLogAction $logAction,
        private readonly RefundFailedTransactionAction $refundAction,
        private readonly DiscordWebhookService $discord,
        private readonly CustomerNumberFormatter $customerNumberFormatter,
    ) {}

    /**
     * Process a uxiotopup status callback.
     *
     * Payload is flat: {id, idtrx, keterangan, status, url_cb} where `idtrx` is
     * our invoice_number, `id` is uxiotopup's own invoice and `keterangan` the
     * serial number.
     *
     * Infrastructure failures are allowed to propagate so the controller can
     * return a non-2xx response and uxiotopup will retry delivery. Non-retryable
     * cases (unknown idtrx, already-terminal transaction) return quietly.
     *
     * @param  array<string,mixed>  $payload
     */
    public function execute(array $payload): void
    {
        if (empty($payload['idtrx'])) {
            return;
        }

        // Side effects that hit the network are captured here and run AFTER the
        // transaction commits, so we never hold a row lock across an HTTP call.
        $notification = null;   // [Transaction, oldStatus, newStatus] for Discord
        $needsRefund = false;   // provider failed → refund after commit

        DB::transaction(function () use ($payload, &$notification, &$needsRefund) {
            $transaction = Transaction::with(['payment', 'paymentChannel', 'user'])
                ->where('invoice_number', $payload['idtrx'])
                ->lockForUpdate()
                ->first();

            if (! $transaction) {
                Log::channel('uxiotopup')->warning("Uxiotopup Webhook: Transaction not found for idtrx {$payload['idtrx']}");

                return;
            }

            // Idempotency guard: skip if already in a terminal state
            if (in_array($transaction->status, [TransactionStatus::COMPLETED, TransactionStatus::FAILED_PROVIDER], true)) {
                Log::channel('uxiotopup')->info("Uxiotopup Webhook: Skipped — {$transaction->invoice_number} already {$transaction->status->value}");

                return;
            }

            $oldStatus = $transaction->status;
            $newStatus = $this->mapUxiotopupStatus($payload['status'] ?? 'pending');

            $sn = (string) ($payload['keterangan'] ?? '');

            $transaction->update([
                // The order response may have been lost (duplicate-idtrx path),
                // so the callback is also where supplier_trx_id self-heals.
                'supplier_trx_id' => ($payload['id'] ?? null) ?: $transaction->supplier_trx_id,
                'sn' => $sn !== '' ? $sn : $transaction->sn,
                'supplier_status' => $payload['status'] ?? $transaction->supplier_status,
                'status' => $newStatus,
            ]);

            if ($newStatus === TransactionStatus::FAILED_PROVIDER) {
                // Refund is delegated to the shared, idempotent action after commit
                // (it re-locks the row and no-ops if already refunded).
                $needsRefund = true;
            }

            $this->logAction->execute(new CreateActivityLogDTO(
                userId: $transaction->user_id,
                ipAddress: request()->ip() ?? '127.0.0.1',
                userAgent: 'Uxiotopup Webhook',
                message: "Uxiotopup updated {$transaction->invoice_number} to ".($payload['status'] ?? $newStatus->value).'. SN: '.($sn !== '' ? $sn : '-'),
            ));

            $notification = [$transaction->fresh(), $oldStatus, $newStatus];
        });

        // ── Post-commit side effects (no DB lock held) ───────────────────────
        if ($needsRefund && $notification !== null) {
            // Single source of truth for wallet + gateway refund; idempotent.
            $this->refundAction->execute($notification[0]);
        }

        if ($notification !== null) {
            [$transaction, $oldStatus, $newStatus] = $notification;

            // Order fulfilled — email the receipt to the buyer (idempotent).
            if ($newStatus === TransactionStatus::COMPLETED) {
                app(SendTransactionReceiptAction::class)->execute($transaction);
            }

            $this->sendToDiscord($transaction, $oldStatus, $newStatus);
        }
    }

    private function sendToDiscord(Transaction $transaction, TransactionStatus $oldStatus, TransactionStatus $newStatus): void
    {
        $color = match ($newStatus) {
            TransactionStatus::COMPLETED => DiscordWebhookService::COLOR_GREEN,
            TransactionStatus::FAILED_PROVIDER => DiscordWebhookService::COLOR_RED,
            TransactionStatus::EXPIRED => DiscordWebhookService::COLOR_ORANGE,
            default => DiscordWebhookService::COLOR_YELLOW,
        };

        // Show exactly what was sent to uxiotopup, composed by the same formatter the
        // fulfilment path uses — a second hand-rolled join here would silently drift.
        // Never let a notification break the webhook: sendToDiscord() runs post-commit
        // on an already-updated transaction, so a throw here would report failure for
        // an order that actually succeeded.
        try {
            $target = $this->customerNumberFormatter->forTransaction($transaction);
        } catch (Throwable $e) {
            $target = $transaction->target_uid.($transaction->target_server ?? '');
        }

        $this->discord->sendEmbed('[UXIOTOPUP] 🔔 Update Transaksi Uxiotopup', [
            ['name' => '🧾 Invoice',       'value' => '`'.$transaction->invoice_number.'`', 'inline' => true],
            ['name' => '📱 Target',        'value' => '`'.$target.'`', 'inline' => true],
            ['name' => '📊 Status',        'value' => "~~{$oldStatus->value}~~ ➔ **{$newStatus->value}**", 'inline' => false],
            ['name' => '🔑 Serial Number', 'value' => $transaction->sn ? '`'.$transaction->sn.'`' : '*Belum ada SN*', 'inline' => false],
        ], $color);
    }
}
