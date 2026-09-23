<?php

namespace App\Jobs;

use App\Models\ServiceInvoice;
use App\Services\DiscordWebhookService;
use App\Services\HubClient;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Records a merchant's service purchase on the Uxio Hub in real time, so the
 * Hub's order queue is live rather than up to a minute stale.
 *
 * Deliberately a QUEUED, fire-and-forget job: the purchase (and its Monetapay
 * payment) has already committed on this site by the time we dispatch, and a
 * slow or unreachable Hub must never fail or delay it. Retries cover a transient
 * Hub outage; a permanent failure only logs + alerts, because the Hub's own
 * 1-minute pull re-asserts the same row and heals anything the retries missed.
 *
 * The payload is the exact shape of GET /v1/hub/service-orders, and the Hub
 * upserts by invoice_number — so pushing the same invoice again (a status
 * change, or a retry racing the pull) can only ever update the one row.
 */
class PushServiceOrderToHubJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $backoff = 30;

    public function __construct(public ServiceInvoice $invoice) {}

    /**
     * The single gate for whether an order push happens at all, so a standalone
     * deployment (the default) never enqueues a no-op job on every purchase and
     * the three call sites can't drift on the condition.
     */
    public static function maybeDispatch(ServiceInvoice $invoice): void
    {
        if (config('services.hub.enabled') && config('services.hub.push_orders')) {
            self::dispatch($invoice);
        }
    }

    public function handle(HubClient $hub): void
    {
        // Defence in depth: the config could have flipped between enqueue and
        // run. maybeDispatch() is the primary gate.
        if (! config('services.hub.enabled') || ! config('services.hub.push_orders')) {
            return;
        }

        // Read the committed row fresh so a status transition dispatched right
        // after the update always sends the settled value.
        $invoice = $this->invoice->fresh(['service:id,code', 'merchant:id,name']) ?? $this->invoice;

        $hub->pushServiceOrder([
            'invoice_number' => $invoice->invoice_number,
            'service_code' => $invoice->service?->code,
            'service_name' => $invoice->service_name,
            'amount' => (int) $invoice->amount,
            'status' => $invoice->status?->value,
            'merchant_name' => $invoice->merchant?->name,
            'ordered_at' => $invoice->created_at?->toIso8601String(),
        ]);
    }

    public function failed(Throwable $e): void
    {
        // The purchase is already complete; a failed push is an eventual-
        // consistency event the 1-minute Hub pull will heal. Never touch the
        // invoice — only surface it for eyes.
        Log::error('PushServiceOrderToHubJob: all retries exhausted', [
            'invoice_number' => $this->invoice->invoice_number,
            'error' => $e->getMessage(),
        ]);

        app(DiscordWebhookService::class)->sendAlert(
            "Gagal mengirim order layanan ke Hub: {$this->invoice->invoice_number} — {$e->getMessage()}"
        );
    }
}
