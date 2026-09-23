<?php

namespace App\Jobs;

use App\Services\PiWapiService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Delivers a refund notification over WhatsApp via PiWAPI.
 *
 * Takes an already-composed message rather than a model: the claim variant
 * carries a one-time token that must not be re-derivable from a serialized job
 * payload sitting in the `jobs` table longer than the message itself.
 *
 * No-op — not a failure — when PiWAPI is unconfigured or WhatsApp delivery is
 * switched off (`PIWAPI_ENABLED=false`, the default); both are expected states,
 * not errors to retry. Queued with retries so a transient gateway blip does not
 * drop the notification on the first HTTP hiccup.
 */
class SendRefundWhatsAppJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    /** @var array<int, int> */
    public array $backoff = [60, 300, 900];

    public function __construct(public string $recipient, public string $message) {}

    public function handle(PiWapiService $piwapi): void
    {
        if (! $piwapi->canSend()) {
            return;
        }

        $piwapi->sendText($this->recipient, $this->message);
    }

    public function failed(Throwable $e): void
    {
        // The email is the primary channel; a dead WhatsApp must not read as a
        // failed refund. Log the recipient, never the message — it may hold a
        // claim link.
        Log::channel('piwapi')->error('SendRefundWhatsAppJob: retries exhausted', [
            'recipient' => $this->recipient,
            'error' => $e->getMessage(),
        ]);
    }
}
