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
        $baseUrl = rtrim((string) config('services.hub.base_url'), '/');
        $apiKey = (string) config('services.hub.api_key');

        if ($baseUrl === '' || $apiKey === '') {
            throw new Exception('Hub belum dikonfigurasi (HUB_BASE_URL / HUB_SITE_API_KEY kosong).');
        }

        $response = $this->client()
            ->withHeaders(['X-Site-Key' => $apiKey])
            ->post($baseUrl.'/api/v1/sites/service-orders', $payload);

        if (! $response->successful()) {
            Log::error('Hub service-order push failed', [
                'http_status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new Exception("Hub service-order push error: HTTP {$response->status()}");
        }

        if (($response->json('status') ?? null) !== 'success') {
            $message = (string) ($response->json('message') ?? 'Unexpected response');
            Log::error('Hub service-order push error envelope', ['message' => $message]);
            throw new Exception("Hub service-order push error: {$message}");
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

    /** @return array<int, array<string, mixed>> */
    private function get(string $path, string $label): array
    {
        $baseUrl = rtrim((string) config('services.hub.base_url'), '/');
        $apiKey = (string) config('services.hub.api_key');

        if ($baseUrl === '' || $apiKey === '') {
            throw new Exception('Hub belum dikonfigurasi (HUB_BASE_URL / HUB_SITE_API_KEY kosong).');
        }

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

            if (($envelope['status'] ?? null) !== 'success' || ! is_array($data) || ! array_is_list($data)) {
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

    private function client(): PendingRequest
    {
        return Http::timeout(self::HTTP_TIMEOUT)->connectTimeout(self::HTTP_CONNECT_TIMEOUT);
    }
}
