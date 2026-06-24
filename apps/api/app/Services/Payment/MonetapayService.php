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
     */
    public function decryptPayload(string $encodedContent): array
    {
        $key = $this->deriveAesParam(config('services.monetapay.aes_key'));
        $iv  = $this->deriveAesParam(config('services.monetapay.aes_iv'));

        $decrypted = openssl_decrypt(
            base64_decode($encodedContent),
            'AES-128-CBC',
            $key,
            OPENSSL_RAW_DATA,
            $iv
        );

        if ($decrypted === false || $decrypted === '') {
            throw new Exception('AES Decryption failed: invalid key, IV, or ciphertext.');
        }

        $parsed = $this->parseKeyValueString($decrypted);

        if (empty($parsed)) {
            throw new Exception('AES Decryption failed: decrypted payload produced an empty result.');
        }

        return $parsed;
    }

    /**
     * Parse Monetapay's "__"-delimited "key=value" flat string into an associative array.
     */
    private function parseKeyValueString(string $raw): array
    {
        $result = [];

        foreach (explode('__', $raw) as $segment) {
            $delimPos = strpos($segment, '=');

            if ($delimPos === false || $delimPos === 0) {
                continue;
            }

            $key          = substr($segment, 0, $delimPos);
            $value        = substr($segment, $delimPos + 1);
            $result[$key] = $value;
        }

        return $result;
    }

    /**
     * Verify the Double MD5 signature on an inbound Monetapay callback payload.
     */
    public function verifyCallbackSignature(array $payload): bool
    {
        $receivedSign = $payload['sign']      ?? null;
        $timestamp    = $payload['timestamp'] ?? null;

        if (!$receivedSign || !$timestamp) {
            return false;
        }

        $params = $payload;
        unset($params['sign'], $params['timestamp']);
        ksort($params);

        $buffer = '';
        foreach ($params as $key => $value) {
            $buffer .= $key . '=' . $value . '__';
        }
        $strMap = rtrim($buffer, '_');
        if ($buffer !== '' && str_ends_with($buffer, '__')) {
            $strMap = substr($buffer, 0, -2);
        }

        $originalString = $this->token . "*|*" . $strMap . "@!@" . $timestamp;
        $expectedSign   = md5(md5($originalString));

        return hash_equals($expectedSign, strtolower((string) $receivedSign));
    }

    /**
     * Create a new transaction on Monetapay
     */
    public function createTransaction(string $referenceId, int $amount, string $paymentType, string $channelCode, array $customerData = []): array
    {
        // 1. Routing Endpoint Dinamis
        $endpointSuffix = match ($paymentType) {
            'qris'              => '/v1.0.0/qris',
            'virtual_account'   => '/v1.0.0/virtual_account',
            'ewallet'           => '/v1.0.0/ewallet/charge', // 6.2.1 EWallet Create (brief p.28)
            'convenience_store' => '/v1.0.0/retail',  // Pastikan suffix ini sesuai dokumen Monetapay
            default             => '/v1.0.0/virtual_account',
        };

        $endpoint = $this->baseUrl . $endpointSuffix;
        $isQris   = $paymentType === 'qris';

        // 2. Parameter Bisnis Murni (tanpa timestamp & sign)
        $requestParams = [
            'app_id'       => $this->mchId,
            'mch_order_no' => (string) $referenceId,
            'amount'       => (string) $amount,
            'currency'     => 'IDR',
        ];

        if ($isQris) {
            $requestParams['is_single_use']  = "1";
            $requestParams['qr_string_type'] = "2";
        } elseif ($paymentType === 'ewallet') {
            $requestParams['terminal_type']        = 'WEB';
            $requestParams['channel_code']         = strtoupper($channelCode);
            $requestParams['product_id']           = $customerData['product_id'] ?? '1';
            $requestParams['product_name']         = $customerData['product_name'] ?? 'Top Up';
            $requestParams['product_price']        = $customerData['product_price'] ?? (string) $amount;
            $requestParams['product_quantity']     = '1';
            $requestParams['product_type']         = 'PRODUCT';
            $requestParams['product_category']     = $customerData['product_category'] ?? 'General';
            $requestParams['account_phone']        = (string) ($customerData['customer_phone'] ?? '08123456789');
            $requestParams['success_redirect_url'] = config('services.monetapay.success_redirect_url', 'https://example.com');
            $requestParams['expire_seconds']       = '7200';
        } else {
            $requestParams['account_name']      = (string) ($customerData['customer_name'] ?? 'Guest');
            $requestParams['account_bank_code'] = strtoupper(str_replace('_va', '', strtolower($channelCode)));
            $requestParams['account_phone']     = (string) ($customerData['customer_phone'] ?? '08123456789');
            $requestParams['is_single_use']     = (string) ($customerData['is_single_use'] ?? '1');
            $requestParams['expire_seconds']    = "600";
        }

        // 3. Format menjadi TreeMap (Sorting Abjad)
        ksort($requestParams);

        // 4. Gabungkan String (key=value__)
        $buffer = '';
        foreach ($requestParams as $key => $value) {
            $buffer .= $key . '=' . $value . '__';
        }

        // Hapus "__" di dua karakter terakhir
        $strMap = substr($buffer, 0, -2);

        // 5. Perhitungan Signature (Double MD5 + Pemisah Custom)
        $timestamp = (string) time(); // 10-digit epoch

        // originalString = Token + "*|*" + strMap + "@!@" + timestamp
        $originalString = $this->token . "*|*" . $strMap . "@!@" . $timestamp;

        // sign = MD5(MD5(originalString))
        $sign = md5(md5($originalString));

        // 6. Pembentukan String Akhir yang akan Dienkripsi AES
        $strToEncrypt = $strMap . "__sign=" . $sign . "__timestamp=" . $timestamp;

        // 7. Eksekusi Enkripsi
        $enData = $this->encryptPayload($strToEncrypt);

        // 8. Request Body Sesuai Contoh Dokumen
        $requestBody = [
            'data' => [
                'partner_key' => $this->partnerKey,
                'en_data'     => $enData,
            ]
        ];

        // Debug Log Trace awal
        Log::info('Monetapay Validated Trace', [
            'strMap'         => $strMap,
            'originalString' => $originalString,
            'strToEncrypt'   => $strToEncrypt,
        ]);

        try {
            // Hapus Query Parameters sepenuhnya, cukup kirim JSON Body
            $response = Http::post($endpoint, $requestBody);

            if ($response->failed()) {
                $errorData = $response->json();
                $errorMessage = $errorData['message'] ?? $errorData['msg'] ?? $response->body();

                Log::error('Monetapay Create Transaction Failed', [
                    'body'     => $requestBody,
                    'response' => $errorData,
                ]);

                throw new Exception("Monetapay API Error [HTTP {$response->status()}]: {$errorMessage}");
            }

            $responseData = $response->json();

            // Log respons penuh dari Monetapay API
            Log::info('Monetapay API Creation Response', $responseData);

            $apiCode        = $responseData['code'] ?? null;
            $apiMessage     = strtolower($responseData['message'] ?? $responseData['msg'] ?? '');
            $innerErrorCode = $responseData['data']['error_code'] ?? null;

            // Kondisi Sukses: HTTP Code 0/200, ATAU inner error_code 7010 (Processing)
            $isSuccess = ($apiCode == 200 || $apiCode == 0 || $apiMessage === 'success' || $innerErrorCode == 7010);

            if (!$isSuccess) {
                // Pemetaan Retry berdasarkan Dokumen MPT
                $retryableCodes = [7002, 7003, 7004, 7005, 7008, 7009, 7011, 7015];
                $canRetry = in_array($innerErrorCode, $retryableCodes) || in_array($apiCode, $retryableCodes);

                $advice = $canRetry ? '[RETRY ALLOWED]' : '[FATAL]';
                $reason = $responseData['data']['error_msg'] ?? $responseData['message'] ?? 'Unknown Error';

                throw new Exception("Monetapay API Error {$advice} [Code: {$apiCode}|{$innerErrorCode}]: {$reason}");
            }

            $actionData = [];
            $resData    = $responseData['data'] ?? [];

            // Monetapay's own transaction ID — persisted to payments.pg_transaction_id
            $actionData['order_no'] = $resData['order_no'] ?? null;

            if ($isQris) {
                $actionData['qr_string'] = $resData['qr_string'] ?? null;
            } elseif ($paymentType === 'ewallet') {
                $actionData['redirect_url'] = $resData['redirect_url'] ?? null;
                $actionData['deeplink_url'] = $resData['deeplink_url'] ?? null;
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

    /* =====================================================================
     | Generic signed/plain transports
     |
     | These power every inquiry/cancel/refund endpoint. They reuse the SAME
     | Double-MD5 + AES-128-CBC algorithm proven by createTransaction(), but
     | are kept as separate helpers so the stabilized createTransaction body
     | is never touched.
     * ===================================================================== */

    /**
     * Build the signed + AES-encrypted envelope and POST it to Monetapay.
     * Returns the full decoded JSON response (code/message/data/...).
     *
     * @param array<string,scalar> $businessParams  Pure business params (no timestamp/sign). Arrays are excluded from the encrypted payload.
     * @param array<string,mixed>  $plainBody       Extra fields merged into the outer request body (not encrypted). Use for nested arrays like order_items.
     */
    private function postSigned(string $endpointSuffix, array $businessParams, bool $passthrough = false, array $plainBody = []): array
    {
        // Inject merchant ID so all signed calls include app_id in the encrypted TreeMap.
        $businessParams['app_id'] = $this->mchId;

        // Monetapay omits blank fields from the signed TreeMap; mirror that so
        // our local sign matches what the gateway recomputes on its side.
        // Arrays are excluded here — nested structures must go in $plainBody instead.
        $businessParams = array_filter(
            $businessParams,
            static fn ($value) => $value !== null && $value !== '' && !is_array($value)
        );

        ksort($businessParams);

        $buffer = '';
        foreach ($businessParams as $key => $value) {
            $buffer .= $key . '=' . (string) $value . '__';
        }
        $strMap = $buffer === '' ? '' : substr($buffer, 0, -2);

        $timestamp      = (string) time();
        $originalString = $this->token . "*|*" . $strMap . "@!@" . $timestamp;
        $sign           = md5(md5($originalString));

        $strToEncrypt = $strMap === ''
            ? "sign=" . $sign . "__timestamp=" . $timestamp
            : $strMap . "__sign=" . $sign . "__timestamp=" . $timestamp;

        $enData = $this->encryptPayload($strToEncrypt);

        $response = Http::post($this->baseUrl . $endpointSuffix, array_merge([
            'data' => [
                'partner_key' => $this->partnerKey,
                'en_data'     => $enData,
            ],
        ], $plainBody));

        return $this->parseResponse($endpointSuffix, $response, $passthrough);
    }

    /**
     * POST a plain (non-encrypted) JSON body. A handful of Monetapay endpoints
     * (payin query, cdm query, merchant permission) accept raw params.
     *
     * @param array<string,mixed> $body
     */
    private function postPlain(string $endpointSuffix, array $body): array
    {
        $body = array_filter($body, static fn ($value) => $value !== null && $value !== '');

        $response = Http::post($this->baseUrl . $endpointSuffix, $body);

        return $this->parseResponse($endpointSuffix, $response);
    }

    /**
     * Shared HTTP failure handling + JSON decoding for the helpers above.
     */
    private function parseResponse(string $endpointSuffix, \Illuminate\Http\Client\Response $response, bool $passthrough = false): array
    {
        if ($response->failed()) {
            $error   = $response->json();
            $message = $error['message'] ?? $error['msg'] ?? $response->body();

            Log::error('Monetapay request failed', [
                'endpoint' => $endpointSuffix,
                'status'   => $response->status(),
                'response' => $error,
            ]);

            if (!$passthrough) {
                throw new Exception("Monetapay API Error [HTTP {$response->status()}]: {$message}");
            }

            return $response->json() ?? [];
        }

        Log::info('Monetapay request OK', [
            'endpoint' => $endpointSuffix,
            'response' => $response->json(),
        ]);

        return $response->json() ?? [];
    }

    /* =====================================================================
     | 5. Balance
     * ===================================================================== */

    /** 5.1 Balance Inquiry — POST /v1.0.0/balance */
    public function inquiryBalance(?string $subMchId = null, ?string $currency = null): array
    {
        return $this->postSigned('/v1.0.0/balance', [
            'sub_mch_id' => $subMchId,
            'currency'   => $currency,
        ]);
    }

    /* =====================================================================
     | 6.x Pay-in inquiries (signed)
     * ===================================================================== */

    /** 6.1.2 VA Inquiry — POST /v1.0.0/virtual_account/query */
    public function inquiryVirtualAccount(array $params): array
    {
        return $this->postSigned('/v1.0.0/virtual_account/query', $params);
    }

    /** 6.2.2 E-Wallet Inquiry — POST /v1.0.0/ewallet/charge/query */
    public function inquiryEwallet(array $params): array
    {
        return $this->postSigned('/v1.0.0/ewallet/charge/query', $params);
    }

    /** 6.3.3 QRIS Inquiry — POST /v1.0.0/qris/query */
    public function inquiryQris(array $params): array
    {
        return $this->postSigned('/v1.0.0/qris/query', $params);
    }

    /** 6.4.2 Payment Link Inquiry — POST /v1.0.0/payment-link/query */
    public function inquiryPaymentLink(array $params): array
    {
        return $this->postSigned('/v1.0.0/payment-link/query', $params);
    }

    /** 6.8.2 Cross-Border QR Inquiry — POST /v1.0.0/cross-border-qr/query */
    public function inquiryCrossBorderQr(array $params): array
    {
        return $this->postSigned('/v1.0.0/cross-border-qr/query', $params);
    }

    /** 6.6.5 Repay Order Query — POST /v1.0.0/repay/query */
    public function inquiryRepay(array $params): array
    {
        return $this->postSigned('/v1.0.0/repay/query', $params);
    }

    /** 6.6.4 Refund Query — POST /v1.0.0/refund/query */
    public function inquiryRefund(array $params): array
    {
        return $this->postSigned('/v1.0.0/refund/query', $params);
    }

    /* =====================================================================
     | 6.5 Subscriptions (signed)
     * ===================================================================== */

    /** 6.5.5 Subscription Order Query — POST /v1.0.0/subscription/query */
    public function inquirySubscription(array $params): array
    {
        return $this->postSigned('/v1.0.0/subscription/query', $params);
    }

    /** 6.5.7 Query Subscription Deduction Cycle — POST /v1.0.0/subscription/cycle/fetch-by-order-no */
    public function fetchSubscriptionCycle(array $params): array
    {
        return $this->postSigned('/v1.0.0/subscription/cycle/fetch-by-order-no', $params);
    }

    /* =====================================================================
     | 6.7 Sub-merchant (signed)
     * ===================================================================== */

    /** 6.7.4 Sub-merchant Register Status Inquiry — POST /v1.0.0/subMch/registration/query */
    public function inquirySubMerchant(array $params): array
    {
        return $this->postSigned('/v1.0.0/subMch/registration/query', $params);
    }

    /* =====================================================================
     | 6.9 / 6.11 (plain body)
     * ===================================================================== */

    /** 6.9.2 CDM Order Inquiry — POST /v1.0.0/cdm/query (plain body) */
    public function inquiryCdm(array $params): array
    {
        return $this->postPlain('/v1.0.0/cdm/query', $params);
    }

    /** 6.11.2 Payin Inquiry — POST /v1.0.0/payin/query (plain JSON body) */
    public function inquiryPayin(array $params): array
    {
        return $this->postPlain('/v1.0.0/payin/query', $params);
    }

    /* =====================================================================
     | 6.6 Common — Cancel & Refund (signed, state-changing)
     * ===================================================================== */

    /** 6.6.1 Cancel — POST /v1.0.0/cancel */
    public function cancelTransaction(array $params): array
    {
        return $this->postSigned('/v1.0.0/cancel', $params);
    }

    /** 6.6.2 Refund — POST /v1.0.0/refund */
    public function refundTransaction(array $params): array
    {
        return $this->postSigned('/v1.0.0/refund', $params);
    }

    /* =====================================================================
     | 6.4 Payment Link — Create
     * ===================================================================== */

    /** 6.4.1 Payment Link Create — POST /v1.0.0/payment-link/create */
    public function createPaymentLink(array $params): array
    {
        return $this->postSigned('/v1.0.0/payment-link/create', $params, passthrough: true);
    }

    /* =====================================================================
     | 6.5 Subscriptions — Create & Deactivate
     * ===================================================================== */

    /** 6.5.1 Customer Create — POST /v1.0.0/customer/create */
    public function createCustomer(array $params): array
    {
        return $this->postSigned('/v1.0.0/customer/create', $params, passthrough: true);
    }

    /** 6.5.2 Customer Update — POST /v1.0.0/customer/update */
    public function updateCustomer(array $params): array
    {
        return $this->postSigned('/v1.0.0/customer/update', $params, passthrough: true);
    }

    /** 6.5.3 Customer Query — POST /v1.0.0/customer (spec says GET but MPT uses encrypted body) */
    public function queryCustomer(array $params): array
    {
        return $this->postSigned('/v1.0.0/customer', $params);
    }

    /** 6.5.4 Subscription Apply — POST /v1.0.0/subscription/apply */
    public function applySubscription(array $params): array
    {
        // order_items is a nested array that must be sent plain outside en_data.
        // Including it in the encrypted key=value string breaks Monetapay's parser.
        $orderItems = $params['order_items'] ?? [];
        unset($params['order_items']);

        return $this->postSigned(
            '/v1.0.0/subscription/apply',
            $params,
            passthrough: true,
            plainBody: $orderItems ? ['order_items' => $orderItems] : []
        );
    }

    /** 6.5.2 Subscription Create — POST /v1.0.0/subscription/create */
    public function createSubscription(array $params): array
    {
        $orderItems = $params['order_items'] ?? [];
        unset($params['order_items']);

        return $this->postSigned(
            '/v1.0.0/subscription/create',
            $params,
            passthrough: true,
            plainBody: $orderItems ? ['order_items' => $orderItems] : []
        );
    }

    /** 6.5.6 Subscription Deactivate — POST /v1.0.0/subscription/deactivate */
    public function deactivateSubscription(array $params): array
    {
        return $this->postSigned('/v1.0.0/subscription/deactivate', $params, passthrough: true);
    }

    /** 6.5.8 Subscription Cycle Attempt (manual deduction trigger) — POST /v1.0.0/subscription/cycle/attempt */
    public function attemptSubscriptionCycle(array $params): array
    {
        return $this->postSigned('/v1.0.0/subscription/cycle/attempt', $params, passthrough: true);
    }

    /* =====================================================================
     | 7. Pay-out (signed)
     * ===================================================================== */

    /** 7.1.1 Disbursement Create — POST /v1.0.0/disbursement */
    public function createDisbursement(array $params): array
    {
        return $this->postSigned('/v1.0.0/disbursement', $params, passthrough: true);
    }

    /** 7.2.1 Large Payout Create — POST /v1.0.0/large-payout */
    public function createLargePayout(array $params): array
    {
        return $this->postSigned('/v1.0.0/large-payout', $params, passthrough: true);
    }

    /** 7.3.1 EWallet Payout Create — POST /v1.0.0/ewallet/payout */
    public function createEwalletPayout(array $params): array
    {
        return $this->postSigned('/v1.0.0/ewallet/payout', $params, passthrough: true);
    }

    /** 7.4.1 Payout Order Inquiry — POST /v1.0.0/disbursement/query */
    public function inquiryDisbursement(array $params): array
    {
        return $this->postSigned('/v1.0.0/disbursement/query', $params);
    }

    /* =====================================================================
     | 8. Account Validation (signed)
     * ===================================================================== */

    /** 8.1 / 8.2 Account Validation — POST /v1.0.0/inquiry-account */
    public function accountValidation(array $params): array
    {
        return $this->postSigned('/v1.0.0/inquiry-account', $params);
    }

    /* =====================================================================
     | 9. Transaction Records (signed)
     * ===================================================================== */

    /** 9.1 Daily Bill Inquiry — POST /v1.0.0/bills/by-daily */
    public function dailyBillInquiry(array $params): array
    {
        return $this->postSigned('/v1.0.0/bills/by-daily', $params, passthrough: true);
    }

    /** 9.2 Bill Flow Inquiry — POST /v1.0.0/bills */
    public function billFlowInquiry(array $params): array
    {
        return $this->postSigned('/v1.0.0/bills', $params, passthrough: true);
    }

    /* =====================================================================
     | 15. Transfer (signed)
     * ===================================================================== */

    /** 15.2 Transfer Query — POST /v1.0.0/mch/transfer/query */
    public function transferQuery(array $params): array
    {
        return $this->postSigned('/v1.0.0/mch/transfer/query', $params);
    }

    /* =====================================================================
     | 16. Merchant Permission (plain body)
     * ===================================================================== */

    /** 16.1 Merchant Permission Inquiry — POST /v1.0.0/mch/permission/query (plain body) */
    public function merchantPermissionQuery(array $params): array
    {
        return $this->postPlain('/v1.0.0/mch/permission/query', $params);
    }
}
