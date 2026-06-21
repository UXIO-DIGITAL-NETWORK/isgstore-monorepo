<?php

namespace App\Actions\Digiflazz;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\Payment;
use App\Models\Transaction;
use App\Services\Payment\MonetapayService;
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
        private readonly MonetapayService $monetapayService,
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
        $gatewayRefund = null;   // Payment awaiting an external Monetapay refund

        DB::transaction(function () use ($data, &$notification, &$gatewayRefund) {
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
                // Wallet refunds happen here (atomic DB op); gateway refunds are
                // deferred to after commit and returned for processing.
                $gatewayRefund = $this->refundFailedTransaction($transaction);
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
        if ($gatewayRefund !== null) {
            $this->processGatewayRefund($gatewayRefund);
        }

        if ($notification !== null) {
            [$transaction, $oldStatus, $newStatus] = $notification;
            $this->sendToDiscord($transaction, $oldStatus, $newStatus);
        }
    }

    /**
     * Refund a settled payment whose order failed at the provider.
     *
     * Balance-channel payments are refunded to the internal wallet inline (an
     * atomic DB operation). External payments cannot be refunded with a DB call,
     * so the Payment is returned for an after-commit gateway refund.
     *
     * @return Payment|null Payment needing a gateway refund, or null if handled/none.
     */
    private function refundFailedTransaction(Transaction $transaction): ?Payment
    {
        $payment = $transaction->payment;

        // Only refund a payment that was actually settled and not already refunded.
        if (! $payment || $payment->status !== '3') {
            return null;
        }

        // Internal wallet: restore the deducted balance to the member.
        if ($transaction->paymentChannel?->channel_code === 'balance') {
            if ($transaction->user) {
                $transaction->user->increment('balance', $payment->gross_amount);
                $payment->update(['status' => '4']); // 4: Refunded
                Log::info("Auto-refund (wallet): Rp {$payment->gross_amount} restored to User {$transaction->user_id} for {$transaction->invoice_number}");
            }

            return null;
        }

        // External gateway: needs an HTTP call, so defer to after commit.
        if (! $payment->pg_transaction_id) {
            Log::warning("Auto-refund skipped: no gateway order id for {$transaction->invoice_number}. Manual refund required.");

            return null;
        }

        return $payment;
    }

    /**
     * Request a refund back to the original payment method via Monetapay.
     * Runs after commit; a failure here is logged for manual follow-up rather
     * than rolling back the already-finalised FAILED_PROVIDER status.
     */
    private function processGatewayRefund(Payment $payment): void
    {
        try {
            $this->monetapayService->refundTransaction([
                'app_id' => config('services.monetapay.mch_id'),
                'refund_mch_order_no' => 'RFD-'.$payment->reference_id,
                'payment_order_no' => $payment->pg_transaction_id,
                'amount' => (string) $payment->gross_amount,
                'reason' => 'Auto-refund: Digiflazz order failed',
            ]);

            $payment->update(['status' => '4']); // 4: Refunded
            Log::info("Auto-refund (gateway): Monetapay refund requested Rp {$payment->gross_amount} for payment {$payment->reference_id}");
        } catch (Throwable $e) {
            Log::error("Auto-refund (gateway) failed for payment {$payment->reference_id}: {$e->getMessage()}");
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
                'COMPLETED'       => 5763719,   // green
                'FAILED_PROVIDER' => 15548997,  // red
                'EXPIRED'         => 16744448,  // orange
                default           => 16705372,  // yellow
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
