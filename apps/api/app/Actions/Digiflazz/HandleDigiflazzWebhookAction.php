<?php

namespace App\Actions\Digiflazz;

use App\Actions\Log\CreateActivityLogAction;
use App\Actions\Payment\RefundFailedTransactionAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\Transaction;
use App\Traits\MapsDigiflazzStatus;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class HandleDigiflazzWebhookAction
{
    use MapsDigiflazzStatus;

    public function __construct(
        private readonly CreateActivityLogAction $logAction,
        private readonly RefundFailedTransactionAction $refundAction,
    ) {}

    /**
     * Process a Digiflazz status webhook.
     *
     * Infrastructure failures are allowed to propagate so the controller can
     * return a non-2xx response and Digiflazz will retry delivery. Non-retryable
     * cases (unknown ref_id, already-terminal transaction) return quietly.
     *
     * @param  array<string,mixed>  $payload
     */
    public function execute(array $payload): void
    {
        $data = $payload['data'] ?? [];

        if (empty($data) || ! isset($data['ref_id'])) {
            return;
        }

        // Side effects that hit the network are captured here and run AFTER the
        // transaction commits, so we never hold a row lock across an HTTP call.
        $notification = null;   // [Transaction, oldStatus, newStatus] for Discord
        $needsRefund = false;   // provider failed → refund after commit

        DB::transaction(function () use ($data, &$notification, &$needsRefund) {
            $transaction = Transaction::with(['payment', 'paymentChannel', 'user'])
                ->where('invoice_number', $data['ref_id'])
                ->lockForUpdate()
                ->first();

            if (! $transaction) {
                Log::warning("Digiflazz Webhook: Transaction not found for ref_id {$data['ref_id']}");

                return;
            }

            // Idempotency guard: skip if already in a terminal state
            if (in_array($transaction->status, ['COMPLETED', 'FAILED_PROVIDER'], true)) {
                Log::info("Digiflazz Webhook: Skipped — {$transaction->invoice_number} already {$transaction->status}");

                return;
            }

            $oldStatus = $transaction->status;
            $newStatus = $this->mapDigiflazzStatus($data['status'] ?? 'Pending');

            $transaction->update([
                'supplier_trx_id' => $data['trx_id'] ?? $transaction->supplier_trx_id,
                'sn' => $data['sn'] ?? $transaction->sn,
                'supplier_status' => $data['status'] ?? $transaction->supplier_status,
                'status' => $newStatus,
            ]);

            if ($newStatus === 'FAILED_PROVIDER') {
                // Refund is delegated to the shared, idempotent action after commit
                // (it re-locks the row and no-ops if already refunded).
                $needsRefund = true;
            }

            $this->logAction->execute(new CreateActivityLogDTO(
                userId: $transaction->user_id,
                ipAddress: request()->ip() ?? '127.0.0.1',
                userAgent: 'Digiflazz Webhook',
                message: "Digiflazz updated {$transaction->invoice_number} to ".($data['status'] ?? $newStatus).'. SN: '.($data['sn'] ?? '-'),
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
            $this->sendToDiscord($transaction, $oldStatus, $newStatus);
        }
    }

    private function sendToDiscord(Transaction $transaction, string $oldStatus, string $newStatus): void
    {
        try {
            $webhookUrl = config('services.discord.webhook_log_url');

            if (! $webhookUrl) {
                return;
            }

            $color = match ($newStatus) {
                'COMPLETED' => 5763719,   // green
                'FAILED_PROVIDER' => 15548997,  // red
                'EXPIRED' => 16744448,  // orange
                default => 16705372,  // yellow
            };

            Http::post($webhookUrl, [
                'embeds' => [[
                    'title' => '🔔 Update Transaksi Digiflazz',
                    'color' => $color,
                    'fields' => [
                        ['name' => '🧾 Invoice',       'value' => '`'.$transaction->invoice_number.'`', 'inline' => true],
                        ['name' => '📱 Target',        'value' => '`'.$transaction->target_uid.($transaction->target_server ? " ({$transaction->target_server})" : '').'`', 'inline' => true],
                        ['name' => '📊 Status',        'value' => "~~{$oldStatus}~~ ➔ **{$newStatus}**", 'inline' => false],
                        ['name' => '🔑 Serial Number', 'value' => $transaction->sn ? '`'.$transaction->sn.'`' : '*Belum ada SN*', 'inline' => false],
                    ],
                    'footer' => ['text' => 'Uxio System Auto-Log'],
                    'timestamp' => now()->toIso8601String(),
                ]],
            ]);
        } catch (Throwable $e) {
            Log::error('Discord notification failed: '.$e->getMessage());
        }
    }
}
