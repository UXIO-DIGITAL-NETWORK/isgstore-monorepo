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
        
        // Sesuai Java: Kunci AES dipaksa menjadi 16 byte menggunakan padding string "0" (AES-128-CBC)
        $this->aesKey = $this->formatAesKeyIv(config('services.monetapay.aes_key'));
        $this->aesIv = $this->formatAesKeyIv(config('services.monetapay.aes_iv'));
        
        $this->baseUrl = config('services.monetapay.is_production')
            ? 'https://api.monetapay.net'
            : 'https://sandbox-api.monetapay.net';
    }

    /**
     * Translasi dari Java: createKey & createIV
     */
    private function formatAesKeyIv(?string $password): string
    {
        $password = (string) $password;
        $sb = $password;
        while (strlen($sb) < 16) {
            $sb .= "0"; // Gunakan karakter string "0", bukan \0
        }
        if (strlen($sb) > 16) {
            $sb = substr($sb, 0, 16);
        }
        return $sb;
    }

    /**
     * Encrypt string menggunakan AES-128-CBC dan PKCS5/7 Padding
     */
    public function encryptPayload(string $content): string
    {
        $encrypted = openssl_encrypt(
            $content, 
            'aes-128-cbc', 
            $this->aesKey, 
            OPENSSL_RAW_DATA, 
            $this->aesIv
        );
        return base64_encode($encrypted);
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
            
            if (($responseData['code'] ?? '') !== 200 && ($responseData['message'] ?? '') !== 'SUCCESS') {
                throw new Exception("Monetapay API Error: " . ($responseData['message'] ?? 'Unknown Error'));
            }

            $actionData = [];
            $resData = $responseData['data'] ?? [];
            
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