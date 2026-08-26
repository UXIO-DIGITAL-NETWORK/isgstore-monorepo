<?php

namespace App\Services;

use Exception;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Outbound client for the Uxio Hub: this site pulls its catalog and channel
 * fee settings from the Hub on a schedule (pull-only — the Hub never pushes).
 * Authenticated by the same per-site key the Hub uses inbound, sent as
 * X-Site-Key.
 *
 * A 200-with-error-envelope is a hard failure, not an empty result: treating a
 * refused response as "empty catalog" would deactivate every service on the
 * next sync — the same failure mode UxiotopupService guards against.
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
