<?php

namespace App\Jobs;

use App\Enums\PaymentStatus;
use App\Models\Payment;
use App\Services\DiscordWebhookService;
use App\Services\Payment\MonetapayService;
use Exception;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Request a Monetapay refund for a settled payment whose order failed at the
 * provider. Queued with retries so a transient gateway outage no longer strands
 * the customer's money behind a single logged-and-forgotten HTTP failure.
 *
 * Idempotent: the payment row is re-checked under lock and skipped unless its
 * status is still '3' (Success); the refund order number is deterministic
 * (RFD-{reference_id}) so Monetapay deduplicates any double request.
 */
class RefundGatewayJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 5;

    /** @var array<int, int> */
    public array $backoff = [60, 300, 900, 3600];

    public function __construct(public Payment $payment) {}

    public function handle(MonetapayService $monetapay): void
    {
        // Re-check under lock; skip when another worker already refunded it.
        $current = DB::transaction(function () {
            return Payment::whereKey($this->payment->getKey())->lockForUpdate()->first();
        });

        if (! $current || $current->status !== PaymentStatus::SUCCESS) {
            return;
        }

        // HTTP call runs outside any DB transaction so no row lock spans it.
        $response = $monetapay->refundTransaction([
            'app_id' => config('services.monetapay.collection_app_id'),
            'refund_mch_order_no' => 'RFD-'.$current->reference_id,
            'payment_order_no' => $current->pg_transaction_id,
            'amount' => (string) $current->gross_amount,
            'reason' => 'Auto-refund: Digiflazz order failed',
        ]);

        // postSigned() throws on HTTP failure, but a 200 body can still carry a
        // business error code — treat that as retryable too.
        $code = $response['code'] ?? null;
        if (! in_array($code, [0, 200, '0', '200'], true) && strtolower((string) ($response['message'] ?? '')) !== 'success') {
            throw new Exception('Monetapay refund rejected: '.json_encode($response));
        }

        $current->update(['status' => PaymentStatus::REFUNDED]);
        Log::channel('monetapay')->info("Auto-refund (gateway): Monetapay refund requested Rp {$current->gross_amount} for payment {$current->reference_id}");
    }

    public function failed(Throwable $e): void
    {
        Log::channel('monetapay')->error("RefundGatewayJob: retries exhausted for payment {$this->payment->reference_id}: {$e->getMessage()}");

        app(DiscordWebhookService::class)->sendEmbed(
            '[MONETAPAY] 🚨 System Alert',
            [],
            DiscordWebhookService::COLOR_RED,
            "Manual refund required: payment `{$this->payment->reference_id}` (Rp ".number_format($this->payment->gross_amount).') — Monetapay refund failed after all retries.'
        );
    }
}
