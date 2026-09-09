<?php

namespace App\Jobs;

use App\Models\ServiceInvoice;
use App\Services\DiscordWebhookService;
use App\Services\HubClient;
use App\Support\Payment\WebsiteService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Tells the Hub that this site's owner paid to renew the site itself.
 *
 * The Hub owns the term but not the money: a client renews through their own
 * checkout, here, and this is how that payment reaches the authority that
 * decides whether the site keeps serving. Without it a client could pay, watch
 * the invoice go green, and still have their storefront switched off — which is
 * the single worst failure this whole feature could produce.
 *
 * Queued and fire-and-forget for the same reason as the service-order push: the
 * payment has already committed, and a slow Hub must never fail it. Retries
 * cover a transient outage. There is no pull-based backstop for this one, so a
 * permanent failure alerts rather than only logging — an operator extending the
 * term by hand is the fallback.
 *
 * The Hub is idempotent on our invoice number, so a retry — or a redelivery
 * months later — can only ever land once.
 */
class PushLicenceRenewalJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 5;

    public int $backoff = 60;

    public function __construct(public ServiceInvoice $invoice) {}

    /**
     * The one gate: only this site's OWN subscription renews the licence. A
     * client buying a domain or a WhatsApp API from the same catalog must not
     * extend their website term.
     */
    public static function maybeDispatch(ServiceInvoice $invoice): void
    {
        if (! config('services.hub.enabled') || ! config('services.hub.managed_licence')) {
            return;
        }

        if ($invoice->service?->code !== WebsiteService::code()) {
            return;
        }

        self::dispatch($invoice);
    }

    public function handle(HubClient $hub): void
    {
        if (! config('services.hub.enabled') || ! config('services.hub.managed_licence')) {
            return;
        }

        $invoice = $this->invoice->fresh();

        if ($invoice === null) {
            return;
        }

        $hub->pushLicenceRenewal([
            'invoice_number' => $invoice->invoice_number,
            'service_code' => WebsiteService::code(),
            // The term the client actually bought, frozen on the invoice at
            // purchase — not today's catalog value, which may have changed.
            'days' => (int) $invoice->duration_days,
            'paid_at' => $invoice->verified_at?->toIso8601String(),
        ]);
    }

    public function failed(Throwable $e): void
    {
        Log::error('Hub licence renewal push failed permanently', [
            'invoice_number' => $this->invoice->invoice_number,
            'error' => $e->getMessage(),
        ]);

        // No pull heals this one: the Hub has no way to learn about a payment it
        // was never told about. A human has to extend the term.
        app(DiscordWebhookService::class)->sendAlert(
            "Perpanjangan lisensi {$this->invoice->invoice_number} gagal dilaporkan ke Hub — "
                .'perpanjang manual di panel Hub, atau situs akan mati meski klien sudah bayar.'
        );
    }
}
