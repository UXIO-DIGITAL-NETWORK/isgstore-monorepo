<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DigiflazzService
{
    private string $username;
    private string $key;
    private string $baseUrl;

    public function __construct()
    {
        $this->username = config('services.digiflazz.username');
        $this->key      = config('services.digiflazz.key');
        $this->baseUrl  = config('services.digiflazz.base_url');
    }

    private function generateSignature(string $refId): string
    {
        return md5($this->username . $this->key . $refId);
    }

    public function getPriceList(): array
    {
        $payload = [
            'cmd'      => 'prepaid',
            'username' => $this->username,
            'sign'     => $this->generateSignature('pricelist'),
        ];

        // [CHECKPOINT 1] Pre-request — full payload before the wire call
        Log::info('Digiflazz getPriceList Request', $payload);

        try {
            $response = Http::post("{$this->baseUrl}/price-list", $payload);

            if (!$response->successful()) {
                // [CHECKPOINT 3] HTTP-level failure (4xx/5xx)
                Log::error('Digiflazz getPriceList Failed', [
                    'http_status' => $response->status(),
                    'body'        => $response->body(),
                ]);

                throw new Exception('Digiflazz API Error: ' . $response->body());
            }

            $data = $response->json('data') ?? [];

            // [CHECKPOINT 2] Post-response — summary of what Digiflazz returned
            Log::info('Digiflazz getPriceList Response', [
                'product_count' => count($data),
            ]);

            return $data;

        } catch (Exception $e) {
            // [CHECKPOINT 3] Connection/infrastructure exception
            Log::error('Digiflazz getPriceList Exception', [
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function createTransaction(string $buyerSkuCode, string $customerNo, string $refId): array
    {
        $payload = [
            'username'       => $this->username,
            'buyer_sku_code' => $buyerSkuCode,
            'customer_no'    => $customerNo,
            'ref_id'         => $refId,
            'sign'           => $this->generateSignature($refId),
        ];

        // [CHECKPOINT 1] Pre-request — exact JSON body going to Digiflazz
        Log::info('Digiflazz createTransaction Request', $payload);

        try {
            $response = Http::post("{$this->baseUrl}/transaction", $payload);

            if (!$response->successful()) {
                // [CHECKPOINT 3] HTTP-level failure before we even get a data envelope
                Log::error('Digiflazz createTransaction HTTP Failed', [
                    'http_status' => $response->status(),
                    'payload'     => $payload,
                    'response'    => $response->body(),
                ]);

                throw new Exception('Digiflazz Transaction Error: ' . $response->body());
            }

            $responseData = $response->json();

            // [CHECKPOINT 2] Post-response — full Digiflazz response envelope
            Log::info('Digiflazz createTransaction Response', $responseData ?? []);

            return $responseData['data'] ?? [];

        } catch (Exception $e) {
            // [CHECKPOINT 3] Exception re-logged with key identifiers, then re-thrown
            // so ProcessDigiflazzTopup can honour its $tries/$backoff retry policy
            Log::error('Digiflazz createTransaction Exception', [
                'ref_id'         => $refId,
                'buyer_sku_code' => $buyerSkuCode,
                'customer_no'    => $customerNo,
                'message'        => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}
