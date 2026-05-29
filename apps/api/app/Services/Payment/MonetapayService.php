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
    private string $baseUrl;

    public function __construct()
    {
        $this->mchId      = config('services.monetapay.mch_id');
        $this->partnerKey = config('services.monetapay.partner_key');
        $this->token      = config('services.monetapay.token');
        $this->baseUrl    = config('services.monetapay.is_production')
            ? 'https://api.monetapay.net'
            : 'https://sandbox-api.monetapay.net';
    }

    /**
     * Official SDK: pads to exactly 16 bytes using null bytes (\0), not "0" character.
     * substr enforces the 16-byte ceiling if the config value is already longer.
     */
    private function deriveAesParam(?string $value): string
    {
        return substr(str_pad((string) $value, 16, "\0"), 0, 16);
    }

    /**
     * AES-128-CBC encrypt → base64.
     * Key and IV are derived fresh each call to stay aligned with the SDK's static helpers.
     */
    public function encryptPayload(string $content): string
    {
        $key = $this->deriveAesParam(config('services.monetapay.aes_key'));
        $iv  = $this->deriveAesParam(config('services.monetapay.aes_iv'));

        $encrypted = openssl_encrypt($content, 'AES-128-CBC', $key, OPENSSL_RAW_DATA, $iv);

        return base64_encode($encrypted);
    }

    /**
     * AES-128-CBC decrypt → associative array.
     * Used by MonetapayCallbackController to decode the inbound webhook payload.
     *
     * @throws Exception on openssl failure
     */
    public function decryptPayload(string $encodedContent): array
    {
        $key  = $this->deriveAesParam(config('services.monetapay.aes_key'));
        $iv   = $this->deriveAesParam(config('services.monetapay.aes_iv'));

        $decrypted = openssl_decrypt(
            base64_decode($encodedContent),
            'AES-128-CBC',
            $key,
            OPENSSL_RAW_DATA,
            $iv
        );

        if ($decrypted === false) {
            throw new Exception('AES Decryption failed: invalid key, IV, or ciphertext.');
        }

        $data = json_decode($decrypted, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('AES Decryption failed: decrypted payload is not valid JSON.');
        }

        return $data;
    }

    /**
     * Verify the Double MD5 signature on an inbound Monetapay callback payload.
     * Mirrors the signature algorithm used in createTransaction — same token, same strMap format.
     *
     * @param array $payload The associative array produced by decryptPayload()
     */
    public function verifyCallbackSignature(array $payload): bool
    {
        $receivedSign = $payload['sign']      ?? null;
        $timestamp    = $payload['timestamp'] ?? null;

        if (!$receivedSign || !$timestamp) {
            return false;
        }

        // Rebuild strMap from all fields except sign and timestamp (same as createTransaction step 2-3)
        $params = array_filter(
            $payload,
            fn(string $k) => !in_array($k, ['sign', 'timestamp'], true),
            ARRAY_FILTER_USE_KEY
        );
        ksort($params);

        $buffer = '';
        foreach ($params as $key => $value) {
            $buffer .= $key . '=' . $value . '__';
        }
        $strMap = substr($buffer, 0, -2);

        $originalString = $this->token . "*|*" . $strMap . "@!@" . $timestamp;
        $expectedSign   = md5(md5($originalString));

        // hash_equals prevents timing-based side-channel attacks
        return hash_equals($expectedSign, strtolower((string) $receivedSign));
    }

    /**
     * Create a new transaction on Monetapay
     */
    public function createTransaction(string $referenceId, int $amount, string $paymentType, string $channelCode, array $customerData = []): array
    {
        $isQris = $paymentType === 'qris';
        $endpoint = $this->baseUrl . ($isQris ? '/v1.0.0/qris' : '/v1.0.0/virtual_account');

        // 1. Parameter Bisnis Murni (tanpa timestamp & sign)
        $requestParams = [
            'app_id' => $this->mchId,
            'mch_order_no' => (string) $referenceId,
            'amount' => (string) $amount,
        ];
        
        if ($isQris) {
            $requestParams['is_single_use'] = "1";
            $requestParams['qr_string_type'] = "2"; 
        } else {
            $requestParams['account_name'] = (string) ($customerData['customer_name'] ?? 'Customer');
            $requestParams['account_bank_code'] = strtoupper(str_replace('_va', '', strtolower($channelCode))); 
            $requestParams['account_phone'] = (string) ($customerData['customer_phone'] ?? '080000000000');
        }

        // 2. Format menjadi TreeMap (Sorting Abjad)
        ksort($requestParams);

        // 3. Gabungkan String (key=value__) seperti perulangan buffer.append di Java
        $buffer = '';
        foreach ($requestParams as $key => $value) {
            $buffer .= $key . '=' . $value . '__';
        }
        
        // Hapus "__" di dua karakter terakhir
        $strMap = substr($buffer, 0, -2); 

        // 4. Perhitungan Signature (Double MD5 + Pemisah Custom)
        $timestamp = (string) time(); // 10-digit epoch
        
        // originalString = Token + "*|*" + strMap + "@!@" + timestamp
        $originalString = $this->token . "*|*" . $strMap . "@!@" . $timestamp;
        
        // sign = MD5(MD5(originalString))
        $sign = md5(md5($originalString));

        // 5. Pembentukan String Akhir yang akan Dienkripsi AES
        $strToEncrypt = $strMap . "__sign=" . $sign . "__timestamp=" . $timestamp;

        // 6. Eksekusi Enkripsi
        $enData = $this->encryptPayload($strToEncrypt);

        // 7. Request Body Sesuai Contoh Dokumen
        $requestBody = [
            'data' => [
                'partner_key' => $this->partnerKey,
                'en_data' => $enData,
            ]
        ];

        // Debug Log untuk mengawal kesamaan dengan Java
        Log::info('Monetapay Validated Trace', [
            'strMap' => $strMap,
            'originalString' => $originalString,
            'strToEncrypt' => $strToEncrypt,
        ]);

        try {
            // Hapus Query Parameters sepenuhnya, cukup kirim JSON Body
            $response = Http::post($endpoint, $requestBody);
            
            if ($response->failed()) {
                $errorData = $response->json();
                $errorMessage = $errorData['message'] ?? $errorData['msg'] ?? $response->body();
                
                Log::error('Monetapay Create Transaction Failed', [
                    'body' => $requestBody,
                    'response' => $errorData,
                ]);
                
                throw new Exception("Monetapay API Error [HTTP {$response->status()}]: {$errorMessage}");
            }

            $responseData = $response->json();
            
            // ==========================================
            // FIX: Validasi Respons Fleksibel (Case-Insensitive)
            // ==========================================
            $apiCode = $responseData['code'] ?? null;
            $apiMessage = strtolower($responseData['message'] ?? $responseData['msg'] ?? '');
            
            if ($apiCode != 200 && $apiCode != 0 && $apiMessage !== 'success') {
                throw new Exception("Monetapay API Error [Code: {$apiCode}]: " . ($responseData['message'] ?? 'Unknown Error'));
            }
            // ==========================================

            $actionData = [];
            $resData = $responseData['data'] ?? [];

            // Monetapay's own transaction ID — persisted to payments.pg_transaction_id
            $actionData['order_no'] = $resData['order_no'] ?? null;

            if ($isQris) {
                $actionData['qr_string'] = $resData['qr_string'] ?? null;
            } else {
                $actionData['virtual_account'] = $resData['virtual_account'] ?? null;
                $actionData['bank_code']       = $resData['account_bank_code'] ?? null;
            }

            return ['data' => $actionData];
        } catch (Exception $e) {
            Log::error('Monetapay Exception', ['message' => $e->getMessage()]);
            throw $e;
        } 
    }
}