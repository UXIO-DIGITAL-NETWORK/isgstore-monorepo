<?php

namespace App\Services\Payment;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Exception;

class MonetapayService
{
    private string $mchId;
    private string $partnerKey;
    private string $token;
    private string $aesKey;
    private string $aesIv;
    private string $baseUrl;

    public function __construct()
    {
        $this->mchId = config('services.monetapay.mch_id');
        $this->partnerKey = config('services.monetapay.partner_key');
        $this->token = config('services.monetapay.token');
        
        // Ensure AES key is 32 bytes for aes-256-cbc. If it's 16 bytes, pad it.
        $key = config('services.monetapay.aes_key');
        $this->aesKey = str_pad($key, 32, "\0");
        $this->aesIv = config('services.monetapay.aes_iv');
        
        $this->baseUrl = config('services.monetapay.is_production')
            ? 'https://api.monetapay.net' // Production URL
            : 'https://sandbox-api.monetapay.net'; // Sandbox URL based on docs
    }

    /**
     * Encrypt payload using strictly AES-256-CBC with OPENSSL_RAW_DATA.
     */
    public function encryptPayload(array $data): string
    {
        $jsonData = json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $encrypted = openssl_encrypt(
            $jsonData, 
            'aes-256-cbc', 
            $this->aesKey, 
            OPENSSL_RAW_DATA, 
            $this->aesIv
        );
        return base64_encode($encrypted);
    }

    /**
     * Decrypt payload using AES-256-CBC.
     */
    public function decryptPayload(string $encryptedData): array
    {
        $decoded = base64_decode($encryptedData);
        $decrypted = openssl_decrypt(
            $decoded, 
            'aes-256-cbc', 
            $this->aesKey, 
            OPENSSL_RAW_DATA, 
            $this->aesIv
        );
        
        if ($decrypted === false) {
            throw new Exception("AES Decryption failed");
        }

        return json_decode($decrypted, true);
    }

    /**
     * Create a new transaction on Monetapay dynamically based on channel.
     */
    /**
     * Create a new transaction on Monetapay dynamically based on channel.
     */
    public function createTransaction(string $referenceId, int $amount, string $paymentType, string $channelCode, array $customerData = []): array
    {
        $isQris = $paymentType === 'qris';
        $endpoint = $this->baseUrl . ($isQris ? '/v1.0.0/qris' : '/v1.0.0/virtual_account');

        // 1. 11-Bit Timestamp Formatting
        $timestamp = (string) substr(now()->getTimestampMs(), 0, 11);

        // 2. Group ALL Business Parameters (app_id harus masuk ke en_data)
        $requestParams = [
            'app_id' => $this->mchId, // FIX: Masukkan app_id ke payload inti
            'mch_order_no' => (string) $referenceId,
            'amount' => (string) $amount,
            'timestamp' => $timestamp
        ];
        
        if ($isQris) {
            $requestParams['is_single_use'] = "1";
            $requestParams['qr_string_type'] = 2; // FIX: Wajib integer sesuai spesifikasi YAML
        } else {
            $requestParams['account_name'] = (string) ($customerData['customer_name'] ?? 'Customer');
            // FIX: Wajib kapital (bca_va -> BCA)
            $requestParams['account_bank_code'] = strtoupper(str_replace('_va', '', strtolower($channelCode))); 
            $requestParams['account_phone'] = (string) ($customerData['customer_phone'] ?? '080000000000');
        }
        
        // 3. Strict AES-256-CBC Encryption Layer
        $enData = $this->encryptPayload($requestParams);

        // 4. Signature (sign) Calculation
        // MD5 Sign: app_id + mch_order_no + amount + timestamp + token
        $signString = $this->mchId . $referenceId . $amount . $timestamp . $this->token;
        $sign = md5($signString);

        // 5. Query Parameters vs Request Body Separation
        $queryData = array_merge([
            'sign' => $sign,
        ], $requestParams);

        // FIX: Bungkus payload di dalam root key 'data'
        $requestBody = [
            'data' => [
                'partner_key' => $this->partnerKey,
                'en_data' => $enData,
            ]
        ];

       try {
            $response = Http::withQueryParameters($queryData)->post($endpoint, $requestBody);
            
            // FIX: Tangkap dan lempar pesan error ASLI dari server Monetapay
            if ($response->failed()) {
                $errorData = $response->json();
                // Cari key 'message' atau 'msg', jika tidak ada tampilkan raw body
                $errorMessage = $errorData['message'] ?? $errorData['msg'] ?? $response->body();
                
                Log::error('Monetapay Create Transaction Failed', [
                    'query' => $queryData,
                    'body' => $requestBody,
                    'response' => $errorData,
                ]);
                
                throw new Exception("Monetapay API Error [HTTP {$response->status()}]: {$errorMessage}");
            }

            $responseData = $response->json();
            
            if (($responseData['code'] ?? '') !== 200 && ($responseData['message'] ?? '') !== 'SUCCESS') {
                throw new Exception("Monetapay API Error: " . ($responseData['message'] ?? 'Unknown Error'));
            }

            $actionData = [];
            $resData = $responseData['data'] ?? [];
            
            // Normalize return data format genericly for CheckoutAction
            if ($isQris) {
                $actionData['qr_string'] = $resData['qr_string'] ?? null;
            } else {
                $actionData['virtual_account'] = $resData['virtual_account'] ?? null;
                $actionData['bank_code'] = $resData['account_bank_code'] ?? null;
            }

            return ['data' => $actionData];
        } catch (Exception $e) {
            Log::error('Monetapay Exception', ['message' => $e->getMessage()]);
            throw $e;
        } 
    }
    
}
