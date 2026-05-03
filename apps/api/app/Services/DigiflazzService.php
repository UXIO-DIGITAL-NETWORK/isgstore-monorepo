<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Exception;

class DigiflazzService
{
    private string $username;
    private string $key;
    private string $baseUrl;

    public function __construct()
    {
        $this->username = config('services.digiflazz.username');
        $this->key = config('services.digiflazz.key');
        $this->baseUrl = config('services.digiflazz.base_url');
    }

    /**
     * Membuat signature MD5 sesuai dokumentasi Digiflazz
     */
    private function generateSignature(string $command): string
    {
        return md5($this->username . $this->key . $command);
    }

    public function getPriceList(): array
    {
        $response = Http::post("{$this->baseUrl}/price-list", [
            'cmd' => 'prepaid',
            'username' => $this->username,
            'sign' => $this->generateSignature('pricelist')
        ]);

        if (!$response->successful()) {
            throw new Exception('Digiflazz API Error: ' . $response->body());
        }

        return $response->json('data') ?? [];
    }

    public function createTransaction(string $buyerSkuCode, string $customerNo, string $refId): array
    {
        $response = Http::post("{$this->baseUrl}/transaction", [
            'username' => $this->username,
            'buyer_sku_code' => $buyerSkuCode,
            'customer_no' => $customerNo,
            'ref_id' => $refId,
            'sign' => $this->generateSignature($refId)
        ]);

        if (!$response->successful()) {
            throw new Exception('Digiflazz Transaction Error: ' . $response->body());
        }

        return $response->json('data') ?? [];
    }
}
