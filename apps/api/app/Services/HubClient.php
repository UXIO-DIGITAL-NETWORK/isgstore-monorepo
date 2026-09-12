<?php

namespace App\Services;

use Exception;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Outbound client for the Uxio Hub: this site pulls its catalog and channel
 * fee settings from the Hub on a schedule (pull-only — the Hub never pushes).
 * Authenticated by the same per-site key the Hub uses inbound, sent as
 * X-Site-Key.
 *
 * A 200-with-error-envelope is a hard failure, not an empty result: treating a
 * refused response as "empty catalog" would deactivate every service on the
 * next sync — the same failure mode UxiolabsService guards against.
 */
class HubClient
{
    private const HTTP_TIMEOUT = 15;

    private const HTTP_CONNECT_TIMEOUT = 5;

    /** @return array<int, array<string, mixed>> */
    public function catalog(): array
    {
        return $this->get('/api/v1/sites/catalog', 'catalog');
    }

    /** @return array<int, array<string, mixed>> */
    public function channelSettings(): array
    {
        return $this->get('/api/v1/sites/channel-settings', 'channel-settings');
    }

    /**
     * The periods this site should be billing its owner for.
     *
     * One row per (plan line, period), each carrying an `item_key` this site
     * stores on the invoice it issues, under a unique index. That key — not a
     * date comparison, not a status check — is what makes a sync running every
     * fifteen minutes forever issue exactly one bill per period.
     *
     * WHEN a period appears is the Hub's decision, not ours. If this site also
     * had an opinion about when a renewal falls due, the two would eventually
     * disagree and one period would be billed twice.
     *
     * @return array<int, array<string, mixed>>
     */
    public function plan(): array
    {
        return $this->get('/api/v1/sites/plan', 'plan');
    }

    /**
     * This site's own licence: how long it is paid up for, and whether the Hub
     * has switched it off.
     *
     * An object, not a list, so it goes through its own reader — and it is the
     * one pull that keeps working when the Hub has suspended or de-registered
     * us. That is deliberate on the Hub's side: it is how we learn we have been
     * switched back on.
     *
     * @return array<string, mixed>
     */
    public function licence(): array
    {
        $data = $this->request('/api/v1/sites/licence', 'licence');

        if (array_is_list($data)) {
            throw new Exception('Hub licence error: unexpected shape');
        }

        return $data;
    }

    /**
     * Report a paid renewal to the Hub, which owns the term.
     *
     * The Hub is idempotent on our invoice number, so a retry — or a later
     * redelivery — extends nothing twice. Throws so the calling job retries;
     * it must never be allowed to fail the payment that triggered it.
     *
     * @param  array<string, mixed>  $payload
     */
    public function pushLicenceRenewal(array $payload): void
    {
        $this->post('/api/v1/sites/licence-renewal', $payload, 'licence renewal');
    }

    /**
     * Record a merchant's service purchase on the Hub in real time — the one
     * outbound WRITE (everything else here is a pull). The Hub upserts by
     * invoice_number, so re-sending the same order (a retry, or a later status
     * change) is safe. Throws on any non-2xx / error envelope so the calling
     * job retries; a permanently failed push is healed by the Hub's own 5-min
     * pull, so it must never be allowed to fail the purchase itself.
     *
     * @param  array<string, mixed>  $payload
     */
    public function pushServiceOrder(array $payload): void
    {
        $this->post('/api/v1/sites/service-orders', $payload, 'service-order push');
    }

    /**
     * A site→Hub write. Same failure discipline as the pulls: a non-2xx or an
     * error envelope throws, so the caller (a retrying job) can try again.
     *
     * @param  array<string, mixed>  $payload
     */
    private function post(string $path, array $payload, string $label): void
    {
        [$baseUrl, $apiKey] = $this->credentials();

        $response = $this->client()
            ->withHeaders(['X-Site-Key' => $apiKey])
            ->post($baseUrl.$path, $payload);

        if (! $response->successful()) {
            Log::error("Hub {$label} failed", [
                'http_status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new Exception("Hub {$label} error: HTTP {$response->status()}");
        }

        if (($response->json('status') ?? null) !== 'success') {
            $message = (string) ($response->json('message') ?? 'Unexpected response');
            Log::error("Hub {$label} error envelope", ['message' => $message]);
            throw new Exception("Hub {$label} error: {$message}");
        }
    }

    /**
     * Tell the Hub whether a poked sync actually landed.
     *
     * Without this the Hub only ever learns that we ACCEPTED a poke (its 202),
     * never that we applied it — so a site whose queue worker is dead looks
     * identical to one that synced perfectly. This closes that loop.
     *
     * Reports per-site, not per-poke, on purpose: RunHubSyncJob is
     * ShouldBeUnique for 60s, so five pokes in a minute produce ONE sync. A
     * per-poke ack would leave four rows looking unapplied when they were.
     *
     * Never throws. It carries no data the Hub cannot re-derive by pulling, and
     * a sync that succeeded must not be marked failed because the report of it
     * could not be delivered.
     *
     * @param  list<string>  $targets
     */
    public function reportSyncResult(array $targets, string $status, ?string $message = null): void
    {
        $baseUrl = rtrim((string) config('services.hub.base_url'), '/');
        $apiKey = (string) config('services.hub.api_key');

        if ($baseUrl === '' || $apiKey === '') {
            return;
        }

        try {
            $this->client()
                ->withHeaders(['X-Site-Key' => $apiKey])
                ->post($baseUrl.'/api/v1/sites/sync-ack', [
                    'targets' => array_values($targets),
                    'status' => $status,
                    'message' => $message !== null ? mb_substr($message, 0, 490) : null,
                ]);
        } catch (Throwable $e) {
            Log::info('Hub sync ack undeliverable', ['error' => $e->getMessage()]);
        }
    }

    /**
     * A pull that must be a list — the catalog and the fee schedule.
     *
     * @return array<int, array<string, mixed>>
     */
    private function get(string $path, string $label): array
    {
        $data = $this->request($path, $label);

        if (! array_is_list($data)) {
            Log::error("Hub {$label} error envelope", ['message' => 'Expected a list']);
            throw new Exception("Hub {$label} error: unexpected shape");
        }

        return $data;
    }

    /**
     * The shared pull. A 200-with-error-envelope is a hard failure, not an
     * empty result: reading a refusal as "empty catalog" would deactivate every
     * service on the next sync.
     *
     * @return array<mixed>
     */
    private function request(string $path, string $label): array
    {
        [$baseUrl, $apiKey] = $this->credentials();

        try {
            $response = $this->client()
                ->withHeaders(['X-Site-Key' => $apiKey])
                ->get($baseUrl.$path);

            if (! $response->successful()) {
                Log::error("Hub {$label} pull failed", [
                    'http_status' => $response->status(),
                    'body' => $response->body(),
                ]);
                throw new Exception("Hub {$label} error: HTTP {$response->status()}");
            }

            $envelope = $response->json();
            $data = $envelope['data'] ?? null;

            if (($envelope['status'] ?? null) !== 'success' || ! is_array($data)) {
                $message = (string) ($envelope['message'] ?? 'Unexpected response');
                Log::error("Hub {$label} error envelope", ['message' => $message]);
                throw new Exception("Hub {$label} error: {$message}");
            }

            return $data;
        } catch (Exception $e) {
            Log::error("Hub {$label} exception", ['message' => $e->getMessage()]);
            throw $e;
        }
    }

    /** @return array{0: string, 1: string} */
    private function credentials(): array
    {
        $baseUrl = rtrim((string) config('services.hub.base_url'), '/');
        $apiKey = (string) config('services.hub.api_key');

        if ($baseUrl === '' || $apiKey === '') {
            throw new Exception('Hub belum dikonfigurasi (HUB_BASE_URL / HUB_SITE_API_KEY kosong).');
        }

        return [$baseUrl, $apiKey];
    }

    private function client(): PendingRequest
    {
        return Http::timeout(self::HTTP_TIMEOUT)->connectTimeout(self::HTTP_CONNECT_TIMEOUT);
    }
}
