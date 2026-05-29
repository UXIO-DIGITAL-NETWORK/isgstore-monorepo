<?php

namespace App\Actions\Digiflazz;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class HandleDigiflazzWebhookAction
{
    public function __construct(
        private readonly CreateActivityLogAction $logAction
    ) {}

    public function execute(array $payload): void
    {
        try {
            $data = $payload['data'] ?? [];

            if (empty($data) || !isset($data['ref_id'])) {
                return;
            }

            DB::transaction(function () use ($data) {
                $transaction = Transaction::where('invoice_number', $data['ref_id'])
                    ->lockForUpdate()
                    ->first();

                if (!$transaction) {
                    Log::warning("Digiflazz Webhook: Transaction not found for ref_id {$data['ref_id']}");
                    return;
                }

                // Idempotency guard: skip if already in a terminal state
                if (in_array($transaction->status, ['COMPLETED', 'FAILED_PROVIDER'], true)) {
                    Log::info("Digiflazz Webhook: Skipped — {$transaction->invoice_number} already {$transaction->status}");
                    return;
                }

                $oldStatus = $transaction->status;
                $newStatus = $this->mapInternalStatus($data['status']);

                $transaction->update([
                    'supplier_trx_id' => $data['trx_id']     ?? $transaction->supplier_trx_id,
                    'sn'              => $data['sn']          ?? $transaction->sn,
                    'supplier_status' => $data['status'],
                    'status'          => $newStatus,
                ]);

                // Auto-refund: restore balance if Digiflazz reports failure on a previously paid order
                if ($newStatus === 'FAILED_PROVIDER') {
                    $payment = $transaction->payment;

                    if ($payment && $payment->status == '3' && $transaction->user_id) {
                        $transaction->user->increment('balance', $payment->gross_amount);
                        $payment->update(['status' => '4']); // 4: Refunded
                        Log::info("Auto-refund: Rp {$payment->gross_amount} restored to User {$transaction->user_id} for {$transaction->invoice_number}");
                    }
                }

                $this->logAction->execute(new CreateActivityLogDTO(
                    userId:    $transaction->user_id,
                    ipAddress: request()->ip() ?? '127.0.0.1',
                    userAgent: 'Digiflazz Webhook',
                    message:   "Digiflazz updated {$transaction->invoice_number} to {$data['status']}. SN: " . ($data['sn'] ?? '-')
                ));

                $this->sendToDiscord($transaction, $oldStatus, $newStatus);
            });
        } catch (\Exception $e) {
            Log::error('HandleDigiflazzWebhookAction failed: ' . $e->getMessage());
        }
    }

    private function mapInternalStatus(string $digiflazzStatus): string
    {
        return match (strtolower($digiflazzStatus)) {
            'sukses' => 'COMPLETED',
            'gagal'  => 'FAILED_PROVIDER',
            default  => 'PROCESSING',
        };
    }

    private function sendToDiscord(Transaction $transaction, string $oldStatus, string $newStatus): void
    {
        try {
            $webhookUrl = config('services.discord.webhook_log_url');

            if (!$webhookUrl) {
                return;
            }

            $color = match ($newStatus) {
                'COMPLETED'       => 5763719,   // green
                'FAILED_PROVIDER' => 15548997,  // red
                default           => 16705372,  // yellow
            };

            Http::post($webhookUrl, [
                'embeds' => [[
                    'title' => '🔔 Update Transaksi Digiflazz',
                    'color' => $color,
                    'fields' => [
                        ['name' => '🧾 Invoice',         'value' => '`' . $transaction->invoice_number . '`', 'inline' => true],
                        ['name' => '📱 Target',          'value' => '`' . $transaction->target_uid . ($transaction->target_server ? " ({$transaction->target_server})" : '') . '`', 'inline' => true],
                        ['name' => '📊 Status',          'value' => "~~{$oldStatus}~~ ➔ **{$newStatus}**", 'inline' => false],
                        ['name' => '🔑 Serial Number',   'value' => $transaction->sn ? '`' . $transaction->sn . '`' : '*Belum ada SN*', 'inline' => false],
                    ],
                    'footer'    => ['text' => 'Uxio System Auto-Log'],
                    'timestamp' => now()->toIso8601String(),
                ]],
            ]);
        } catch (\Exception $e) {
            Log::error('Discord notification failed: ' . $e->getMessage());
        }
    }
}
