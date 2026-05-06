<?php

namespace App\Actions\Digiflazz;

use App\Models\Order;
use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http; // Tambahan untuk memanggil API Discord

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
                $order = Order::where('invoice_number', $data['ref_id'])->lockForUpdate()->first();

                if (!$order) {
                    Log::warning("Digiflazz Webhook: Order tidak ditemukan untuk ref_id {$data['ref_id']}");
                    return;
                }

                if (in_array($order->status, ['Success', 'Failed'])) {
                    Log::info("Digiflazz Webhook: Diabaikan. Order {$order->invoice_number} sudah final ({$order->status}).");
                    return;
                }

                $oldStatus = $order->status;
                $newStatus = $this->mapInternalStatus($data['status']);

                // Update Database
                $order->update([
                    'supplier_trx_id' => $data['trx_id'] ?? $order->supplier_trx_id,
                    'sn' => $data['sn'] ?? $order->sn,
                    'supplier_status' => $data['status'],
                    'status' => $newStatus,
                ]);

                // Logika Refund Otomatis
                if ($newStatus === 'Failed') {
                    $payment = $order->payment;
                    if ($payment && $payment->status == '3') {
                        $user = $order->user;
                        $user->increment('balance', $payment->gross_amount);
                        $payment->update(['status' => '4']);
                        Log::info("Refund Otomatis: Saldo Rp {$payment->gross_amount} dikembalikan ke User ID {$user->id} untuk Invoice {$order->invoice_number}.");
                    }
                }

                // Catat di Activity Log (Database)
                $this->logAction->execute(new CreateActivityLogDTO(
                    userId: $order->user_id,
                    ipAddress: request()->ip() ?? '127.0.0.1',
                    userAgent: 'Digiflazz Webhook',
                    message: "Webhook Digiflazz memperbarui Order {$order->invoice_number} menjadi {$data['status']}. SN: " . ($data['sn'] ?? '-')
                ));

                // Kirim Notifikasi ke Discord
                $this->sendToDiscord($order, $oldStatus, $newStatus);
            });
        } catch (\Exception $e) {
            Log::error("Gagal memproses Webhook Digiflazz: " . $e->getMessage());
        }
    }

    private function mapInternalStatus(string $digiflazzStatus): string
    {
        return match (strtolower($digiflazzStatus)) {
            'sukses' => 'Success',
            'gagal' => 'Failed',
            default => 'Processing',
        };
    }

    /**
     * Fungsi khusus untuk mengirim log ke Discord Webhook
     */
    private function sendToDiscord(Order $order, string $oldStatus, string $newStatus): void
    {
        try {
            $webhookUrl = env('DISCORD_WEBHOOK_LOG_URL');

            // Jangan eksekusi jika URL tidak ada di .env
            if (!$webhookUrl) return;

            // Tentukan warna embed berdasarkan status (Desimal Hex Color)
            $color = match ($newStatus) {
                'Success' => 5763719,  // Hijau
                'Failed' => 15548997,  // Merah
                default => 16705372,   // Kuning
            };

            // Format pesan Embed Discord
            $embed = [
                'title' => '🔔 Update Transaksi Digiflazz',
                'color' => $color,
                'fields' => [
                    [
                        'name' => '🧾 Invoice',
                        'value' => '`' . $order->invoice_number . '`',
                        'inline' => true
                    ],
                    [
                        'name' => '📱 Target / Tujuan',
                        'value' => '`' . $order->target_uid . ($order->target_server ? ' (' . $order->target_server . ')' : '') . '`',
                        'inline' => true
                    ],
                    [
                        'name' => '📊 Status',
                       'value' => "~~$oldStatus~~ ➔ **$newStatus**",
                        'inline' => false
                    ],
                    [
                        'name' => '🔑 Serial Number (SN)',
                        'value' => $order->sn ? '`' . $order->sn . '`' : '*Belum ada SN*',
                        'inline' => false
                    ]
                ],
                'footer' => [
                    'text' => 'Uxio System Auto-Log'
                ],
                'timestamp' => now()->toIso8601String(),
            ];

            // Tembak ke API Discord
            Http::post($webhookUrl, [
                'embeds' => [$embed]
            ]);
        } catch (\Exception $e) {
            // Kita log secara internal saja agar tidak mengganggu transaksi jika discord error
            Log::error("Gagal mengirim log ke Discord: " . $e->getMessage());
        }
    }
}
