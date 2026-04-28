<?php

namespace App\Services\Payment;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Exception;

class MonetapayService
{
    private string $merchantId;
    private string $apiKey;
    private string $baseUrl;

    public function __construct()
    {
        $this->merchantId = config('services.monetapay.merchant_id');
        $this->apiKey = config('services.monetapay.api_key');
        $this->baseUrl = config('services.monetapay.is_production')
            ? 'https://api.monetapay.com' // Replace with actual production URL
            : 'https://sandbox.api.monetapay.com'; // Replace with actual sandbox URL
    }

    /**
     * Generate security signature for requests.
     */
    public function generateSignature(string $referenceId, int $amount): string
    {
        // Example logic: MD5 of merchant_id + api_key + reference_id + amount
        // Update this logic based on Monetapay's actual documentation
        return md5($this->merchantId . $this->apiKey . $referenceId . $amount);
    }

    /**
     * Create a new transaction on Monetapay.
     */
    public function createTransaction(string $referenceId, int $amount, string $channel, array $customerData = []): array
    {
        $endpoint = $this->baseUrl . '/v1/transaction/create';

        $payload = [
            'merchant_id' => $this->merchantId,
            'reference_id' => $referenceId,
            'amount' => $amount,
            'channel' => $channel,
            'customer_data' => $customerData,
            'signature' => $this->generateSignature($referenceId, $amount),
        ];

        try {
            $response = Http::post($endpoint, $payload);
            
            if ($response->failed()) {
                Log::error('Monetapay Create Transaction Failed', [
                    'payload' => $payload,
                    'response' => $response->json(),
                ]);
                throw new Exception('Failed to create transaction with Monetapay.');
            }

            return $response->json();
        } catch (Exception $e) {
            Log::error('Monetapay Exception', ['message' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * Check transaction status on Monetapay manually.
     */
    public function checkStatus(string $referenceId, int $amount): array
    {
        $endpoint = $this->baseUrl . '/v1/transaction/status';

        $payload = [
            'merchant_id' => $this->merchantId,
            'reference_id' => $referenceId,
            'signature' => $this->generateSignature($referenceId, $amount),
        ];

        try {
            $response = Http::post($endpoint, $payload);

            if ($response->failed()) {
                Log::error('Monetapay Check Status Failed', [
                    'payload' => $payload,
                    'response' => $response->json(),
                ]);
                throw new Exception('Failed to check status with Monetapay.');
            }

            return $response->json();
        } catch (Exception $e) {
            Log::error('Monetapay Status Exception', ['message' => $e->getMessage()]);
            throw $e;
        }
    }
}
