<?php

namespace App\Services;

use App\Support\Integration\IntegrationConfig;
use Exception;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DigiflazzService
{
    public const PRICE_LIST_CACHE_KEY = 'digiflazz:price-list:';

    public const PRICE_LIST_CACHE_TTL = 300;

    public const BALANCE_CACHE_KEY = 'digiflazz:balance';

    public const BALANCE_CACHE_TTL = 60;

    /** Outbound HTTP bounds — without these a slow/unreachable Digiflazz hangs the request forever. */
    private const HTTP_TIMEOUT = 15;

    private const HTTP_CONNECT_TIMEOUT = 5;

    private string $username;

    private string $key;

    private string $baseUrl;

    public function __construct()
    {
        // DB-backed credentials (admin-editable) merged over config/.env defaults.
        $cfg = IntegrationConfig::for('digiflazz');

        $this->username = (string) ($cfg['username'] ?? '');
        // apiKey is bound to the account's API mode; the formula is identical in both
        // modes, only the key value differs. Prevents a dev key hitting the prod API (rc 41).
        $this->key = (string) (filter_var($cfg['production'] ?? false, FILTER_VALIDATE_BOOLEAN)
            ? ($cfg['prod_key'] ?? '')
            : ($cfg['dev_key'] ?? ''));
        $this->baseUrl = (string) ($cfg['base_url'] ?? 'https://api.digiflazz.com/v1');
    }

    private function generateSignature(string $refId): string
    {
        return md5($this->username.$this->key.$refId);
    }

    /** A pending HTTP request with sane timeouts, so a stalled upstream fails fast instead of hanging the worker. */
    private function client(): PendingRequest
    {
        return Http::timeout(self::HTTP_TIMEOUT)->connectTimeout(self::HTTP_CONNECT_TIMEOUT);
    }

    public function getPriceList(string $cmd = 'prepaid'): array
    {
        $payload = [
            'cmd' => $cmd,
            'username' => $this->username,
            'sign' => $this->generateSignature('pricelist'),
        ];

        // [CHECKPOINT 1] Pre-request — full payload before the wire call
        Log::channel('digiflazz')->info('Digiflazz getPriceList Request', $payload);

        try {
            $response = $this->client()->post("{$this->baseUrl}/price-list", $payload);

            if (! $response->successful()) {
                // [CHECKPOINT 3] HTTP-level failure (4xx/5xx)
                Log::channel('digiflazz')->error('Digiflazz getPriceList Failed', [
                    'http_status' => $response->status(),
                    'body' => $response->body(),
                ]);

                throw new Exception('Digiflazz API Error: '.$response->body());
            }

            $data = $response->json('data');

            // Digiflazz reports auth/permission failures with HTTP 200 and an
            // OBJECT under `data` (e.g. {"rc":"41","message":"Signature tidak
            // valid"}) rather than a list. Returning that as-is makes every
            // caller that iterates the list crash with a TypeError (an Error,
            // not an Exception, so it escapes their catch and 500s). Reject any
            // non-list shape here with a described exception every caller already
            // maps to a clean 502. An empty list stays valid.
            if (! is_array($data) || ! array_is_list($data)) {
                $message = is_array($data)
                    ? ($data['message'] ?? $data['rc'] ?? 'Unexpected price-list response')
                    : 'Unexpected price-list response';

                Log::channel('digiflazz')->error('Digiflazz getPriceList Error Envelope', [
                    'data' => $data,
                ]);

                throw new Exception('Digiflazz price-list error: '.$message);
            }

            // [CHECKPOINT 2] Post-response — summary of what Digiflazz returned
            Log::channel('digiflazz')->info('Digiflazz getPriceList Response', [
                'product_count' => count($data),
            ]);

            return $data;

        } catch (Exception $e) {
            // [CHECKPOINT 3] Connection/infrastructure exception
            Log::channel('digiflazz')->error('Digiflazz getPriceList Exception', [
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Price list via a 5-minute shared cache. The scheduled price checker
     * refreshes this cache on every run, so lookups (SKU preview, manual add,
     * Excel import) almost never trigger their own Digiflazz fetch.
     *
     * @return array<int,array<string,mixed>>
     */
    public function getPriceListCached(string $cmd = 'prepaid'): array
    {
        return Cache::remember(
            self::PRICE_LIST_CACHE_KEY.$cmd,
            self::PRICE_LIST_CACHE_TTL,
            fn () => $this->getPriceList($cmd)
        );
    }

    /**
     * @return array<string,mixed>|null
     */
    public function findSkuInPriceList(string $sku, string $cmd = 'prepaid'): ?array
    {
        foreach ($this->getPriceListCached($cmd) as $item) {
            if (($item['buyer_sku_code'] ?? null) === $sku) {
                return $item;
            }
        }

        return null;
    }

    public function getBalance(): array
    {
        $payload = [
            'cmd' => 'deposit',
            'username' => $this->username,
            'sign' => md5($this->username.$this->key.'depo'),
        ];

        Log::channel('digiflazz')->info('Digiflazz getBalance Request', $payload);

        try {
            $response = $this->client()->post("{$this->baseUrl}/cek-saldo", $payload);

            if (! $response->successful()) {
                Log::channel('digiflazz')->error('Digiflazz getBalance Failed', [
                    'http_status' => $response->status(),
                    'body' => $response->body(),
                ]);
                throw new Exception('Digiflazz Balance Error: '.$response->body());
            }

            $data = $response->json('data') ?? [];
            Log::channel('digiflazz')->info('Digiflazz getBalance Response', $data);

            return $data;

        } catch (Exception $e) {
            Log::channel('digiflazz')->error('Digiflazz getBalance Exception', ['message' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * Balance via a short shared cache. The admin's financial/integration
     * screens (and the 30s integration poll) read this, so without a cache each
     * request would hit Digiflazz live — the same call that hangs the server
     * when the upstream is slow. Cached for a minute so the panel stays fresh
     * enough without hammering the API.
     *
     * @return array<string,mixed>
     */
    public function getBalanceCached(): array
    {
        return Cache::remember(self::BALANCE_CACHE_KEY, self::BALANCE_CACHE_TTL, fn () => $this->getBalance());
    }

    public function checkBill(string $buyerSkuCode, string $customerNo, string $refId): array
    {
        $payload = [
            'username' => $this->username,
            'buyer_sku_code' => $buyerSkuCode,
            'customer_no' => $customerNo,
            'ref_id' => $refId,
            'sign' => $this->generateSignature($refId),
        ];

        Log::channel('digiflazz')->info('Digiflazz checkBill Request', $payload);

        try {
            $response = $this->client()->post("{$this->baseUrl}/cek-tagihan", $payload);

            if (! $response->successful()) {
                Log::channel('digiflazz')->error('Digiflazz checkBill Failed', [
                    'http_status' => $response->status(),
                    'body' => $response->body(),
                ]);
                throw new Exception('Digiflazz Bill Inquiry Error: '.$response->body());
            }

            $data = $response->json('data') ?? [];
            Log::channel('digiflazz')->info('Digiflazz checkBill Response', $data);

            return $data;

        } catch (Exception $e) {
            Log::channel('digiflazz')->error('Digiflazz checkBill Exception', [
                'buyer_sku_code' => $buyerSkuCode,
                'customer_no' => $customerNo,
                'ref_id' => $refId,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function payBill(string $buyerSkuCode, string $customerNo, string $refId): array
    {
        $payload = [
            'username' => $this->username,
            'buyer_sku_code' => $buyerSkuCode,
            'customer_no' => $customerNo,
            'ref_id' => $refId,
            'sign' => $this->generateSignature($refId),
        ];

        Log::channel('digiflazz')->info('Digiflazz payBill Request', $payload);

        try {
            $response = $this->client()->post("{$this->baseUrl}/pay-pasca", $payload);

            if (! $response->successful()) {
                Log::channel('digiflazz')->error('Digiflazz payBill Failed', [
                    'http_status' => $response->status(),
                    'body' => $response->body(),
                ]);
                throw new Exception('Digiflazz Bill Payment Error: '.$response->body());
            }

            $responseData = $response->json();
            Log::channel('digiflazz')->info('Digiflazz payBill Response', $responseData ?? []);

            return $responseData['data'] ?? [];

        } catch (Exception $e) {
            Log::channel('digiflazz')->error('Digiflazz payBill Exception', [
                'buyer_sku_code' => $buyerSkuCode,
                'customer_no' => $customerNo,
                'ref_id' => $refId,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    // Re-sends the same payload to Digiflazz's /transaction endpoint.
    // Digiflazz treats a duplicate ref_id as a status query rather than a new order.
    public function checkTransactionStatus(string $buyerSkuCode, string $customerNo, string $refId): array
    {
        return $this->createTransaction($buyerSkuCode, $customerNo, $refId);
    }

    public function createTransaction(string $buyerSkuCode, string $customerNo, string $refId): array
    {
        $payload = [
            'username' => $this->username,
            'buyer_sku_code' => $buyerSkuCode,
            'customer_no' => $customerNo,
            'ref_id' => $refId,
            'sign' => $this->generateSignature($refId),
        ];

        // [CHECKPOINT 1] Pre-request — exact JSON body going to Digiflazz
        Log::channel('digiflazz')->info('Digiflazz createTransaction Request', $payload);

        try {
            $response = $this->client()->post("{$this->baseUrl}/transaction", $payload);

            if (! $response->successful()) {
                // [CHECKPOINT 3] HTTP-level failure before we even get a data envelope
                Log::channel('digiflazz')->error('Digiflazz createTransaction HTTP Failed', [
                    'http_status' => $response->status(),
                    'payload' => $payload,
                    'response' => $response->body(),
                ]);

                throw new Exception('Digiflazz Transaction Error: '.$response->body());
            }

            $responseData = $response->json();

            // [CHECKPOINT 2] Post-response — full Digiflazz response envelope
            Log::channel('digiflazz')->info('Digiflazz createTransaction Response', $responseData ?? []);

            return $responseData['data'] ?? [];

        } catch (Exception $e) {
            // [CHECKPOINT 3] Exception re-logged with key identifiers, then re-thrown
            // so ProcessDigiflazzTopup can honour its $tries/$backoff retry policy
            Log::channel('digiflazz')->error('Digiflazz createTransaction Exception', [
                'ref_id' => $refId,
                'buyer_sku_code' => $buyerSkuCode,
                'customer_no' => $customerNo,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}
