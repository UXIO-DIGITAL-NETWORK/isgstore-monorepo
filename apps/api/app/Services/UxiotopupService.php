<?php

namespace App\Services;

use App\Exceptions\UxiotopupDuplicateOrderException;
use App\Support\Integration\IntegrationConfig;
use Exception;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class UxiotopupService
{
    public const PRICE_LIST_CACHE_KEY = 'uxiotopup:price-list';

    public const PRICE_LIST_CACHE_TTL = 300;

    public const BALANCE_CACHE_KEY = 'uxiotopup:balance';

    public const BALANCE_CACHE_TTL = 60;

    public const PRICE_TIERS = ['harga', 'harga_gold', 'harga_silver', 'harga_pro'];

    /** Outbound HTTP bounds — without these a slow/unreachable uxiotopup hangs the request forever. */
    private const HTTP_TIMEOUT = 15;

    private const HTTP_CONNECT_TIMEOUT = 5;

    private string $apiKey;

    private string $baseUrl;

    private string $priceTier;

    public function __construct()
    {
        // DB-backed credentials (admin-editable) merged over config/.env defaults.
        $cfg = IntegrationConfig::for('uxiotopup');

        $this->apiKey = (string) ($cfg['api_key'] ?? '');
        $this->baseUrl = rtrim((string) ($cfg['base_url'] ?? 'https://api.uxiotopup.id'), '/');

        $tier = (string) ($cfg['price_tier'] ?? 'harga');
        $this->priceTier = in_array($tier, self::PRICE_TIERS, true) ? $tier : 'harga';
    }

    /** A pending HTTP request with sane timeouts, so a stalled upstream fails fast instead of hanging the worker. */
    private function client(): PendingRequest
    {
        return Http::timeout(self::HTTP_TIMEOUT)->connectTimeout(self::HTTP_CONNECT_TIMEOUT);
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
    public static function isItemActive(array $item): bool
    {
        return strtolower((string) ($item['status'] ?? '')) === 'aktif';
    }

    public function getPriceList(): array
    {
        // [CHECKPOINT 1] Pre-request — api_key never logged
        Log::channel('uxiotopup')->info('Uxiotopup getPriceList Request');

        try {
            $response = $this->client()->post("{$this->baseUrl}/service", [
                'api_key' => $this->apiKey,
            ]);

            if (! $response->successful()) {
                // [CHECKPOINT 3] HTTP-level failure (4xx/5xx)
                Log::channel('uxiotopup')->error('Uxiotopup getPriceList Failed', [
                    'http_status' => $response->status(),
                    'body' => $response->body(),
                ]);

                throw new Exception('Uxiotopup API Error: '.$response->body());
            }

            // uxiotopup reports auth/validation failures with HTTP 200 and
            // {status:false, msg, data:[]}. Returning that as a "price list"
            // would silently deactivate every product on the next sync, so any
            // non-true status or non-list data is rejected here with a
            // described exception every caller already maps to a clean 502.
            $envelope = $response->json();
            $data = $envelope['data'] ?? null;

            if (($envelope['status'] ?? false) !== true || ! is_array($data) || ! array_is_list($data)) {
                $message = (string) ($envelope['msg'] ?? 'Unexpected price-list response');

                Log::channel('uxiotopup')->error('Uxiotopup getPriceList Error Envelope', [
                    'msg' => $message,
                ]);

                throw new Exception('Uxiotopup price-list error: '.$message);
            }

            // [CHECKPOINT 2] Post-response — summary of what uxiotopup returned
            Log::channel('uxiotopup')->info('Uxiotopup getPriceList Response', [
                'service_count' => count($data),
            ]);

            return $data;

        } catch (Exception $e) {
            // [CHECKPOINT 3] Connection/infrastructure exception
            Log::channel('uxiotopup')->error('Uxiotopup getPriceList Exception', [
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Price list via a 5-minute shared cache. The scheduled price checker
     * refreshes this cache on every run, so lookups (service preview, manual
     * add, Excel import) almost never trigger their own uxiotopup fetch.
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
        Log::channel('uxiotopup')->info('Uxiotopup getBalance Request');

        try {
            $response = $this->client()->post("{$this->baseUrl}/saldo", [
                'api_key' => $this->apiKey,
            ]);

            if (! $response->successful()) {
                Log::channel('uxiotopup')->error('Uxiotopup getBalance Failed', [
                    'http_status' => $response->status(),
                    'body' => $response->body(),
                ]);
                throw new Exception('Uxiotopup Balance Error: '.$response->body());
            }

            $envelope = $response->json();

            if (($envelope['status'] ?? false) !== true) {
                $message = (string) ($envelope['msg'] ?? 'Unexpected balance response');
                Log::channel('uxiotopup')->error('Uxiotopup getBalance Error Envelope', ['msg' => $message]);
                throw new Exception('Uxiotopup Balance Error: '.$message);
            }

            $data = is_array($envelope['data'] ?? null) ? $envelope['data'] : [];
            Log::channel('uxiotopup')->info('Uxiotopup getBalance Response', $data);

            return $data;

        } catch (Exception $e) {
            Log::channel('uxiotopup')->error('Uxiotopup getBalance Exception', ['message' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * Balance via a short shared cache. The admin's financial/integration
     * screens (and the 30s integration poll) read this, so without a cache each
     * request would hit uxiotopup live — the same call that hangs the server
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
     * uxiotopup's own invoice, which MUST be persisted (supplier_trx_id) — it
     * is the only key /status accepts.
     *
     * @throws UxiotopupDuplicateOrderException when uxiotopup already holds an
     *                                          order with this idtrx (a prior attempt whose response was lost) —
     *                                          the order exists, so the caller must NOT treat this as a failure.
     */
    public function createOrder(string $serviceId, string $target, string $kontak, string $idtrx): array
    {
        $payload = [
            'service_id' => $serviceId,
            'target' => $target,
            'kontak' => $kontak,
            'idtrx' => $idtrx,
            'callback' => (string) config('services.uxiotopup.callback_url'),
        ];

        // [CHECKPOINT 1] Pre-request — exact body going to uxiotopup, minus the api_key
        Log::channel('uxiotopup')->info('Uxiotopup createOrder Request', $payload);

        try {
            $response = $this->client()->post("{$this->baseUrl}/order", $payload + [
                'api_key' => $this->apiKey,
            ]);

            if (! $response->successful()) {
                // [CHECKPOINT 3] HTTP-level failure before we even get an envelope
                Log::channel('uxiotopup')->error('Uxiotopup createOrder HTTP Failed', [
                    'http_status' => $response->status(),
                    'payload' => $payload,
                    'response' => $response->body(),
                ]);

                throw new Exception('Uxiotopup Order Error: '.$response->body());
            }

            $envelope = $response->json();

            // [CHECKPOINT 2] Post-response — full uxiotopup response envelope
            Log::channel('uxiotopup')->info('Uxiotopup createOrder Response', $envelope ?? []);

            if (($envelope['status'] ?? false) !== true) {
                $message = (string) ($envelope['msg'] ?? 'Unexpected order response');

                // "idtrx sudah ada" — the order was already accepted on a
                // previous attempt (timeout/retry). Unlike Digiflazz, resending
                // is NOT a status query: it is a hard reject, and /status can't
                // look up by idtrx. Surface it as its own type so the caller
                // can settle to PROCESSING and wait for the callback.
                if (str_contains(strtolower($message), 'idtrx sudah ada')) {
                    throw new UxiotopupDuplicateOrderException($idtrx, $message);
                }

                throw new Exception('Uxiotopup Order Error: '.$message);
            }

            return is_array($envelope['data'] ?? null) ? $envelope['data'] : [];

        } catch (Exception $e) {
            // [CHECKPOINT 3] Exception re-logged with key identifiers, then re-thrown
            // so ProcessUxiotopupTopup can honour its $tries/$backoff retry policy
            Log::channel('uxiotopup')->error('Uxiotopup createOrder Exception', [
                'idtrx' => $idtrx,
                'service_id' => $serviceId,
                'target' => $target,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * `$orderId` is uxiotopup's own invoice (transactions.supplier_trx_id),
     * NOT our idtrx — there is no lookup by idtrx on this endpoint.
     */
    public function checkTransactionStatus(string $orderId): array
    {
        Log::channel('uxiotopup')->info('Uxiotopup checkStatus Request', ['order_id' => $orderId]);

        try {
            $response = $this->client()->post("{$this->baseUrl}/status", [
                'api_key' => $this->apiKey,
                'order_id' => $orderId,
            ]);

            if (! $response->successful()) {
                Log::channel('uxiotopup')->error('Uxiotopup checkStatus Failed', [
                    'http_status' => $response->status(),
                    'body' => $response->body(),
                ]);
                throw new Exception('Uxiotopup Status Error: '.$response->body());
            }

            $envelope = $response->json();
            Log::channel('uxiotopup')->info('Uxiotopup checkStatus Response', $envelope ?? []);

            if (($envelope['status'] ?? false) !== true) {
                $message = (string) ($envelope['msg'] ?? 'Unexpected status response');
                throw new Exception('Uxiotopup Status Error: '.$message);
            }

            return is_array($envelope['data'] ?? null) ? $envelope['data'] : [];

        } catch (Exception $e) {
            Log::channel('uxiotopup')->error('Uxiotopup checkStatus Exception', [
                'order_id' => $orderId,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}
