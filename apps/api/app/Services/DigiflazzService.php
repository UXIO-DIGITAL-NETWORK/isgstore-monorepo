<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DigiflazzService
{
    public const PRICE_LIST_CACHE_KEY = 'digiflazz:price-list:';

    public const PRICE_LIST_CACHE_TTL = 300;

    private string $username;

    private string $key;

    private string $baseUrl;

    public function __construct()
    {
        $this->username = config('services.digiflazz.username');
        // apiKey is bound to the account's API mode; the formula is identical in both
        // modes, only the key value differs. Prevents a dev key hitting the prod API (rc 41).
        $this->key = config('services.digiflazz.production')
            ? config('services.digiflazz.prod_key')
            : config('services.digiflazz.dev_key');
        $this->baseUrl = config('services.digiflazz.base_url');
    }

    private function generateSignature(string $refId): string
    {
        return md5($this->username.$this->key.$refId);
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
            $response = Http::post("{$this->baseUrl}/price-list", $payload);

            if (! $response->successful()) {
                // [CHECKPOINT 3] HTTP-level failure (4xx/5xx)
                Log::channel('digiflazz')->error('Digiflazz getPriceList Failed', [
                    'http_status' => $response->status(),
                    'body' => $response->body(),
                ]);

                throw new Exception('Digiflazz API Error: '.$response->body());
            }

            $data = $response->json('data') ?? [];

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
            $response = Http::post("{$this->baseUrl}/cek-saldo", $payload);

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
            $response = Http::post("{$this->baseUrl}/cek-tagihan", $payload);

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
            $response = Http::post("{$this->baseUrl}/pay-pasca", $payload);

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
            $response = Http::post("{$this->baseUrl}/transaction", $payload);

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
