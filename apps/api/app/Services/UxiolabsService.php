<?php

namespace App\Services;

use App\Contracts\SupplierGateway;
use App\Exceptions\UxiolabsDuplicateOrderException;
use App\Support\Integration\IntegrationConfig;
use Exception;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class UxiolabsService implements SupplierGateway
{
    public const PRICE_LIST_CACHE_KEY = 'uxiolabs:price-list';

    public const PRICE_LIST_CACHE_TTL = 300;

    public const BALANCE_CACHE_KEY = 'uxiolabs:balance';

    public const BALANCE_CACHE_TTL = 60;

    public const PRICE_TIERS = ['harga', 'harga_gold', 'harga_silver', 'harga_pro'];

    /** Outbound HTTP bounds — without these a slow/unreachable uxiolabs hangs the request forever. */
    private const HTTP_TIMEOUT = 15;

    private const HTTP_CONNECT_TIMEOUT = 5;

    private string $apiKey;

    private string $baseUrl;

    private string $priceTier;

    public function __construct()
    {
        // DB-backed credentials (admin-editable) merged over config/.env defaults.
        $cfg = IntegrationConfig::for('uxiolabs');

        $this->apiKey = (string) ($cfg['api_key'] ?? '');
        $this->baseUrl = rtrim((string) ($cfg['base_url'] ?? 'https://api.uxiotopup.id'), '/');

        $tier = (string) ($cfg['price_tier'] ?? 'harga');
        $this->priceTier = in_array($tier, self::PRICE_TIERS, true) ? $tier : 'harga';
    }

    public function priceListCacheKey(): string
    {
        return self::PRICE_LIST_CACHE_KEY;
    }

    public function priceListCacheTtl(): int
    {
        return self::PRICE_LIST_CACHE_TTL;
    }

    public function balanceCacheKey(): string
    {
        return self::BALANCE_CACHE_KEY;
    }

    public function balanceCacheTtl(): int
    {
        return self::BALANCE_CACHE_TTL;
    }

    /** A pending HTTP request with sane timeouts, so a stalled upstream fails fast instead of hanging the worker. */
    private function client(): PendingRequest
    {
        return Http::timeout(self::HTTP_TIMEOUT)
            ->connectTimeout(self::HTTP_CONNECT_TIMEOUT)
            // uxiotopup.id sits behind Cloudflare, and its allowlist is keyed on
            // this server's IPv4 address. Left to itself curl prefers the AAAA
            // record, so every call went out from the (unlisted) IPv6 address and
            // came back as a Cloudflare "you have been blocked" HTML page — which
            // surfaces here as a 502 on every price-list-backed endpoint. Pinning
            // the resolver to IPv4 keeps the source address the one that is
            // actually allowlisted.
            ->withOptions(['curl' => [CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4]]);
    }

    /**
     * The supplier cost for a price-list item, read from the configured tier
     * (harga | harga_gold | harga_silver | harga_pro). Falls back to `harga`
     * when the tier column is missing from the row.
     */
    public function costFor(array $item): int
    {
        return (int) ($item[$this->priceTier] ?? $item['harga'] ?? 0);
    }

    /** Whether a price-list item is orderable ("aktif"). */
    public function isItemActive(array $item): bool
    {
        return strtolower((string) ($item['status'] ?? '')) === 'aktif';
    }

    public function getPriceList(): array
    {
        // [CHECKPOINT 1] Pre-request — api_key never logged
        Log::channel('uxiolabs')->info('Uxiolabs getPriceList Request');

        try {
            $response = $this->client()->post("{$this->baseUrl}/service", [
                'api_key' => $this->apiKey,
            ]);

            if (! $response->successful()) {
                // [CHECKPOINT 3] HTTP-level failure (4xx/5xx)
                Log::channel('uxiolabs')->error('Uxiolabs getPriceList Failed', [
                    'http_status' => $response->status(),
                    'body' => $response->body(),
                ]);

                throw new Exception('Uxiolabs API Error: '.$response->body());
            }

            // uxiolabs reports auth/validation failures with HTTP 200 and
            // {status:false, msg, data:[]}. Returning that as a "price list"
            // would silently deactivate every product on the next sync, so any
            // non-true status or non-list data is rejected here with a
            // described exception every caller already maps to a clean 502.
            $envelope = $response->json();
            $data = $envelope['data'] ?? null;

            if (($envelope['status'] ?? false) !== true || ! is_array($data) || ! array_is_list($data)) {
                $message = (string) ($envelope['msg'] ?? 'Unexpected price-list response');

                Log::channel('uxiolabs')->error('Uxiolabs getPriceList Error Envelope', [
                    'msg' => $message,
                ]);

                throw new Exception('Uxiolabs price-list error: '.$message);
            }

            // [CHECKPOINT 2] Post-response — summary of what uxiolabs returned
            Log::channel('uxiolabs')->info('Uxiolabs getPriceList Response', [
                'service_count' => count($data),
            ]);

            return $data;

        } catch (Exception $e) {
            // [CHECKPOINT 3] Connection/infrastructure exception
            Log::channel('uxiolabs')->error('Uxiolabs getPriceList Exception', [
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Price list via a 5-minute shared cache. The scheduled price checker
     * refreshes this cache on every run, so lookups (service preview, manual
     * add, Excel import) almost never trigger their own uxiolabs fetch.
     *
     * @return array<int,array<string,mixed>>
     */
    public function getPriceListCached(): array
    {
        return Cache::remember(
            self::PRICE_LIST_CACHE_KEY,
            self::PRICE_LIST_CACHE_TTL,
            fn () => $this->getPriceList()
        );
    }

    /**
     * The cached price list indexed by service id.
     *
     * Built per call rather than cached: the list is MB-sized and the index is
     * cheap, while a second cache entry would double the memory and could drift
     * from the list it indexes. Callers that look up many SKUs (pooling a batch,
     * a 500-row Excel import) must build it ONCE and reuse it — repeatedly
     * scanning the list per SKU is what this exists to avoid.
     *
     * Keys are cast to string so a numeric service id ("86") does not become an
     * int array key and miss a string lookup.
     *
     * @return array<string,array<string,mixed>>
     */
    public function keyedPriceListCached(): array
    {
        $keyed = [];

        foreach ($this->getPriceListCached() as $item) {
            if (is_array($item) && isset($item['id'])) {
                $keyed[(string) $item['id']] = $item;
            }
        }

        return $keyed;
    }

    /**
     * @return array<string,mixed>|null
     */
    public function findServiceInPriceList(string $serviceId): ?array
    {
        return $this->keyedPriceListCached()[$serviceId] ?? null;
    }

    public function getBalance(): array
    {
        Log::channel('uxiolabs')->info('Uxiolabs getBalance Request');

        try {
            $response = $this->client()->post("{$this->baseUrl}/saldo", [
                'api_key' => $this->apiKey,
            ]);

            if (! $response->successful()) {
                Log::channel('uxiolabs')->error('Uxiolabs getBalance Failed', [
                    'http_status' => $response->status(),
                    'body' => $response->body(),
                ]);
                throw new Exception('Uxiolabs Balance Error: '.$response->body());
            }

            $envelope = $response->json();

            if (($envelope['status'] ?? false) !== true) {
                $message = (string) ($envelope['msg'] ?? 'Unexpected balance response');
                Log::channel('uxiolabs')->error('Uxiolabs getBalance Error Envelope', ['msg' => $message]);
                throw new Exception('Uxiolabs Balance Error: '.$message);
            }

            $data = is_array($envelope['data'] ?? null) ? $envelope['data'] : [];
            Log::channel('uxiolabs')->info('Uxiolabs getBalance Response', $data);

            return $data;

        } catch (Exception $e) {
            Log::channel('uxiolabs')->error('Uxiolabs getBalance Exception', ['message' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * Balance via a short shared cache. The admin's financial/integration
     * screens (and the 30s integration poll) read this, so without a cache each
     * request would hit uxiolabs live — the same call that hangs the server
     * when the upstream is slow. Cached for a minute so the panel stays fresh
     * enough without hammering the API.
     *
     * @return array<string,mixed>
     */
    public function getBalanceCached(): array
    {
        return Cache::remember(self::BALANCE_CACHE_KEY, self::BALANCE_CACHE_TTL, fn () => $this->getBalance());
    }

    /**
     * Places an order. `$idtrx` is our invoice_number; the returned `id` is
     * uxiolabs's own invoice, which MUST be persisted (supplier_trx_id) — it
     * is the only key /status accepts.
     *
     * @throws UxiolabsDuplicateOrderException when uxiolabs already holds an
     *                                         order with this idtrx (a prior attempt whose response was lost) —
     *                                         the order exists, so the caller must NOT treat this as a failure.
     */
    public function createOrder(string $serviceId, string $target, string $kontak, string $idtrx): array
    {
        $payload = [
            'service_id' => $serviceId,
            'target' => $target,
            'kontak' => $kontak,
            'idtrx' => $idtrx,
            'callback' => (string) config('services.uxiolabs.callback_url'),
        ];

        // [CHECKPOINT 1] Pre-request — the body going to uxiolabs, minus the
        // api_key and minus the two identifiers: `target` is the customer's game
        // id and `kontak` their phone number, and this channel is a file on
        // disk. Everything left is what makes a failed order diagnosable.
        Log::channel('uxiolabs')->info('Uxiolabs createOrder Request', [
            ...$payload,
            'target' => substr($target, 0, 3).'…',
            'kontak' => substr($kontak, 0, 3).'…',
        ]);

        try {
            $response = $this->client()->post("{$this->baseUrl}/order", $payload + [
                'api_key' => $this->apiKey,
            ]);

            if (! $response->successful()) {
                // [CHECKPOINT 3] HTTP-level failure before we even get an envelope
                Log::channel('uxiolabs')->error('Uxiolabs createOrder HTTP Failed', [
                    'http_status' => $response->status(),
                    'payload' => $payload,
                    'response' => $response->body(),
                ]);

                throw new Exception('Uxiolabs Order Error: '.$response->body());
            }

            $envelope = $response->json();

            // [CHECKPOINT 2] Post-response — full uxiolabs response envelope
            Log::channel('uxiolabs')->info('Uxiolabs createOrder Response', $envelope ?? []);

            if (($envelope['status'] ?? false) !== true) {
                $message = (string) ($envelope['msg'] ?? 'Unexpected order response');

                // "idtrx sudah ada" — the order was already accepted on a
                // previous attempt (timeout/retry). Unlike Digiflazz, resending
                // is NOT a status query: it is a hard reject, and /status can't
                // look up by idtrx. Surface it as its own type so the caller
                // can settle to PROCESSING and wait for the callback.
                if (str_contains(strtolower($message), 'idtrx sudah ada')) {
                    throw new UxiolabsDuplicateOrderException($idtrx, $message);
                }

                throw new Exception('Uxiolabs Order Error: '.$message);
            }

            return is_array($envelope['data'] ?? null) ? $envelope['data'] : [];

        } catch (Exception $e) {
            // [CHECKPOINT 3] Exception re-logged with key identifiers, then re-thrown
            // so ProcessUxiolabsTopup can honour its $tries/$backoff retry policy
            Log::channel('uxiolabs')->error('Uxiolabs createOrder Exception', [
                'idtrx' => $idtrx,
                'service_id' => $serviceId,
                'target' => substr($target, 0, 3).'…',
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * `$orderId` is uxiolabs's own invoice (transactions.supplier_trx_id),
     * NOT our idtrx — there is no lookup by idtrx on this endpoint.
     */
    public function checkTransactionStatus(string $orderId): array
    {
        Log::channel('uxiolabs')->info('Uxiolabs checkStatus Request', ['order_id' => $orderId]);

        try {
            $response = $this->client()->post("{$this->baseUrl}/status", [
                'api_key' => $this->apiKey,
                'order_id' => $orderId,
            ]);

            if (! $response->successful()) {
                Log::channel('uxiolabs')->error('Uxiolabs checkStatus Failed', [
                    'http_status' => $response->status(),
                    'body' => $response->body(),
                ]);
                throw new Exception('Uxiolabs Status Error: '.$response->body());
            }

            $envelope = $response->json();
            Log::channel('uxiolabs')->info('Uxiolabs checkStatus Response', $envelope ?? []);

            if (($envelope['status'] ?? false) !== true) {
                $message = (string) ($envelope['msg'] ?? 'Unexpected status response');
                throw new Exception('Uxiolabs Status Error: '.$message);
            }

            return is_array($envelope['data'] ?? null) ? $envelope['data'] : [];

        } catch (Exception $e) {
            Log::channel('uxiolabs')->error('Uxiolabs checkStatus Exception', [
                'order_id' => $orderId,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}
