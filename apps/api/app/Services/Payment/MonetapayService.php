<?php

namespace App\Services\Payment;

use App\Support\Integration\IntegrationConfig;
use App\Support\Phone;
use App\Support\PublicUrl;
use Exception;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MonetapayService
{
    public const BALANCE_CACHE_KEY = 'monetapay:balance';

    /**
     * The MAIN-merchant reading, cached apart from the sub-merchant one.
     *
     * `balanceCacheKey()` resolves a null sub-merchant to the site's CONFIGURED
     * sub-merchant, so the two figures cannot share a key — one would overwrite
     * the other and the panel would show a plausible wrong number.
     */
    public const MAIN_BALANCE_CACHE_KEY = 'monetapay:balance:main';

    public const BALANCE_CACHE_TTL = 60;

    /** Outbound HTTP bounds — a stalled Monetapay must not hang the request/worker indefinitely. */
    private const HTTP_TIMEOUT = 15;

    private const HTTP_CONNECT_TIMEOUT = 5;

    private string $subMchId;

    private string $collectionAppId;

    private string $disbursementAppId;

    private string $partnerKey;

    private string $token;

    private string $disbursementPartnerKey;

    private string $disbursementToken;

    private string $disbursementAesKey;

    private string $disbursementAesIv;

    private string $aesKey;

    private string $aesIv;

    private string $baseUrl;

    public function __construct()
    {
        // DB-backed credentials (admin-editable) merged over config/.env defaults.
        $cfg = IntegrationConfig::for('monetapay');

        // The site trades as one sub-merchant under the parent `mch_id`, sharing
        // the parent's credentials — only this identifier distinguishes it. Blank
        // means "main merchant", and every signed call then looks exactly as it
        // did before sub-merchants existed.
        $this->subMchId = (string) ($cfg['sub_mch_id'] ?? '');
        $this->collectionAppId = (string) ($cfg['collection_app_id'] ?? '');
        $this->disbursementAppId = (string) ($cfg['disbursement_app_id'] ?? '');
        $this->partnerKey = (string) ($cfg['partner_key'] ?? '');
        $this->token = (string) ($cfg['token'] ?? '');
        $this->aesKey = (string) ($cfg['aes_key'] ?? '');
        $this->aesIv = (string) ($cfg['aes_iv'] ?? '');
        // Disbursement-specific creds still fall back to the collection ones.
        $this->disbursementPartnerKey = (string) ($cfg['disbursement_partner_key'] ?? $cfg['partner_key'] ?? '');
        $this->disbursementToken = (string) ($cfg['disbursement_token'] ?? $cfg['token'] ?? '');
        $this->disbursementAesKey = (string) ($cfg['disbursement_aes_key'] ?? $cfg['aes_key'] ?? '');
        $this->disbursementAesIv = (string) ($cfg['disbursement_aes_iv'] ?? $cfg['aes_iv'] ?? '');
        $this->baseUrl = filter_var($cfg['is_production'] ?? false, FILTER_VALIDATE_BOOLEAN)
            ? 'https://api.monetapay.net'
            : 'https://sandbox-api.monetapay.net';
    }

    /**
     * The sub-merchant this site trades as, or '' when it trades as the main
     * merchant. Exposed so inbound callbacks can be checked against it.
     */
    public function subMchId(): string
    {
        return $this->subMchId;
    }

    /**
     * Whether an inbound callback names a merchant other than the one this site
     * trades as. Only conclusive when the payload actually carries the field —
     * an absent `sub_mch_id` is not evidence of anything, so it reads as a match.
     */
    public function callbackTargetsAnotherMerchant(array $decrypted): bool
    {
        $callbackSubMchId = (string) ($decrypted['sub_mch_id'] ?? '');

        return $callbackSubMchId !== '' && $callbackSubMchId !== $this->subMchId;
    }

    /** A pending HTTP request with sane timeouts, so a stalled upstream fails fast instead of hanging the worker. */
    private function client(): PendingRequest
    {
        return Http::timeout(self::HTTP_TIMEOUT)->connectTimeout(self::HTTP_CONNECT_TIMEOUT);
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
        $key = $this->deriveAesParam($this->aesKey);
        $iv = $this->deriveAesParam($this->aesIv);

        $encrypted = openssl_encrypt($content, 'AES-128-CBC', $key, OPENSSL_RAW_DATA, $iv);

        return base64_encode($encrypted);
    }

    private function guardDisbursementCredentials(): void
    {
        $effectiveToken = $this->disbursementToken ?: $this->token;
        if ($effectiveToken === '') {
            throw new \RuntimeException(
                'Monetapay token is not configured. Set MONETAPAY_TOKEN in your .env, then run php artisan config:clear.'
            );
        }
    }

    /**
     * AES-128-CBC decrypt → associative array.
     */
    public function decryptPayload(string $encodedContent): array
    {
        $key = $this->deriveAesParam($this->aesKey);
        $iv = $this->deriveAesParam($this->aesIv);

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

            $key = substr($segment, 0, $delimPos);
            $value = substr($segment, $delimPos + 1);
            $result[$key] = $value;
        }

        return $result;
    }

    /**
     * Verify the Double MD5 signature on an inbound Monetapay callback payload.
     */
    public function verifyCallbackSignature(array $payload): bool
    {
        $receivedSign = $payload['sign'] ?? null;
        $timestamp = $payload['timestamp'] ?? null;

        if (! $receivedSign || ! $timestamp) {
            return false;
        }

        $params = $payload;
        unset($params['sign'], $params['timestamp']);
        ksort($params);

        $buffer = '';
        foreach ($params as $key => $value) {
            $buffer .= $key.'='.$value.'__';
        }
        $strMap = rtrim($buffer, '_');
        if ($buffer !== '' && str_ends_with($buffer, '__')) {
            $strMap = substr($buffer, 0, -2);
        }

        $originalString = $this->token.'*|*'.$strMap.'@!@'.$timestamp;
        $expectedSign = md5(md5($originalString));

        return hash_equals($expectedSign, strtolower((string) $receivedSign));
    }

    /**
     * Create a new transaction on Monetapay
     */
    public function createTransaction(string $referenceId, int $amount, string $paymentType, string $channelCode, array $customerData = []): array
    {
        // 1. Routing Endpoint Dinamis
        $endpointSuffix = match ($paymentType) {
            'qris' => '/v1.0.0/qris',
            'virtual_account' => '/v1.0.0/virtual_account',
            'ewallet' => '/v1.0.0/ewallet/charge', // 6.2.1 EWallet Create (brief p.28)
            'convenience_store' => '/v1.0.0/retail',  // Pastikan suffix ini sesuai dokumen Monetapay
            default => '/v1.0.0/virtual_account',
        };

        $endpoint = $this->baseUrl.$endpointSuffix;
        $isQris = $paymentType === 'qris';

        // 2. Parameter Bisnis Murni (tanpa timestamp & sign)
        $requestParams = [
            'app_id' => $this->collectionAppId,
            'mch_order_no' => (string) $referenceId,
            'amount' => (string) $amount,
            'currency' => 'IDR',
        ];

        // Books the pay-in against the site's sub-merchant. Added only when
        // configured: Monetapay drops blank fields from the TreeMap it re-signs,
        // so an empty value here would make our sign disagree with its own.
        // It joins before the ksort below, so it is part of the signed string.
        if ($this->subMchId !== '') {
            $requestParams['sub_mch_id'] = $this->subMchId;
        }

        if ($isQris) {
            $requestParams['is_single_use'] = '1';
            $requestParams['qr_string_type'] = '2';
        } elseif ($paymentType === 'ewallet') {
            $requestParams['terminal_type'] = 'WEB';
            $requestParams['channel_code'] = strtoupper($channelCode);
            $requestParams['product_id'] = $customerData['product_id'] ?? '1';
            $requestParams['product_name'] = $customerData['product_name'] ?? 'Top Up';
            $requestParams['product_price'] = $customerData['product_price'] ?? (string) $amount;
            $requestParams['product_quantity'] = '1';
            $requestParams['product_type'] = 'PRODUCT';
            $requestParams['product_category'] = $customerData['product_category'] ?? 'General';
            $requestParams['account_phone'] = self::indonesianAccountPhone($customerData);
            // The gateway bounces a paying customer here after an e-wallet
            // charge, so it is one more link that must not point at a dev box
            // or at IANA's documentation domain. Unset, the field is simply not
            // sent — the gateway's own default applies, which beats sending a
            // destination nobody can open.
            $successRedirect = PublicUrl::base('services.monetapay.success_redirect_url');

            if ($successRedirect !== null) {
                $requestParams['success_redirect_url'] = $successRedirect;
            }
            $requestParams['expire_seconds'] = '7200';
        } else {
            $requestParams['account_name'] = (string) ($customerData['customer_name'] ?? 'Guest');
            $requestParams['account_bank_code'] = strtoupper(str_replace('_va', '', strtolower($channelCode)));
            $requestParams['account_phone'] = self::indonesianAccountPhone($customerData);
            $requestParams['is_single_use'] = (string) ($customerData['is_single_use'] ?? '1');
            $requestParams['expire_seconds'] = '600';
        }

        // 3. Format menjadi TreeMap (Sorting Abjad)
        ksort($requestParams);

        // 4. Gabungkan String (key=value__)
        $buffer = '';
        foreach ($requestParams as $key => $value) {
            $buffer .= $key.'='.$value.'__';
        }

        // Hapus "__" di dua karakter terakhir
        $strMap = substr($buffer, 0, -2);

        // 5. Perhitungan Signature (Double MD5 + Pemisah Custom)
        $timestamp = (string) time(); // 10-digit epoch

        // originalString = Token + "*|*" + strMap + "@!@" + timestamp
        $originalString = $this->token.'*|*'.$strMap.'@!@'.$timestamp;

        // sign = MD5(MD5(originalString))
        $sign = md5(md5($originalString));

        // 6. Pembentukan String Akhir yang akan Dienkripsi AES
        $strToEncrypt = $strMap.'__sign='.$sign.'__timestamp='.$timestamp;

        // 7. Eksekusi Enkripsi
        $enData = $this->encryptPayload($strToEncrypt);

        // 8. Request Body Sesuai Contoh Dokumen
        $requestBody = [
            'data' => [
                'partner_key' => $this->partnerKey,
                'en_data' => $enData,
            ],
        ];

        // Debug Log Trace awal
        Log::channel('monetapay')->info('Monetapay Validated Trace', [
            'strMap' => $strMap,
            'originalString' => $originalString,
            'strToEncrypt' => $strToEncrypt,
        ]);

        try {
            // Hapus Query Parameters sepenuhnya, cukup kirim JSON Body
            $response = $this->client()->post($endpoint, $requestBody);

            if ($response->failed()) {
                $errorData = $response->json();
                $errorMessage = $errorData['message'] ?? $errorData['msg'] ?? $response->body();

                Log::channel('monetapay')->error('Monetapay Create Transaction Failed', [
                    'body' => $requestBody,
                    'response' => $errorData,
                ]);

                throw new Exception("Monetapay API Error [HTTP {$response->status()}]: {$errorMessage}");
            }

            $responseData = $response->json();

            // Log respons penuh dari Monetapay API
            Log::channel('monetapay')->info('Monetapay API Creation Response', $responseData);

            $apiCode = $responseData['code'] ?? null;
            $apiMessage = strtolower($responseData['message'] ?? $responseData['msg'] ?? '');
            $innerErrorCode = $responseData['data']['error_code'] ?? null;

            // Kondisi Sukses: HTTP Code 0/200, ATAU inner error_code 7010 (Processing)
            $isSuccess = ($apiCode == 200 || $apiCode == 0 || $apiMessage === 'success' || $innerErrorCode == 7010);

            if (! $isSuccess) {
                // Pemetaan Retry berdasarkan Dokumen MPT
                $retryableCodes = [7002, 7003, 7004, 7005, 7008, 7009, 7011, 7015];
                $canRetry = in_array($innerErrorCode, $retryableCodes) || in_array($apiCode, $retryableCodes);

                $advice = $canRetry ? '[RETRY ALLOWED]' : '[FATAL]';
                $reason = $responseData['data']['error_msg'] ?? $responseData['message'] ?? 'Unknown Error';

                throw new Exception("Monetapay API Error {$advice} [Code: {$apiCode}|{$innerErrorCode}]: {$reason}");
            }

            $actionData = [];
            $resData = $responseData['data'] ?? [];

            // Monetapay's own transaction ID — persisted to payments.pg_transaction_id
            $actionData['order_no'] = $resData['order_no'] ?? null;

            if ($isQris) {
                $actionData['qr_string'] = $resData['qr_string'] ?? null;
            } elseif ($paymentType === 'ewallet') {
                $actionData['redirect_url'] = $resData['redirect_url'] ?? null;
                $actionData['deeplink_url'] = $resData['deeplink_url'] ?? null;
            } else {
                $actionData['virtual_account'] = $resData['virtual_account'] ?? null;
                $actionData['bank_code'] = $resData['account_bank_code'] ?? null;
            }

            return ['data' => $actionData];
        } catch (Exception $e) {
            Log::channel('monetapay')->error('Monetapay Exception', ['message' => $e->getMessage()]);
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
     * @param  array<string,scalar>  $businessParams  Pure business params (no timestamp/sign). Arrays are excluded from the encrypted payload.
     * @param  array<string,mixed>  $plainBody  Extra fields merged into the outer request body (not encrypted). Use for nested arrays like order_items.
     */
    private function postSigned(string $endpointSuffix, array $businessParams, bool $passthrough = false, array $plainBody = [], ?string $appId = null, bool $forDisbursement = false, bool $withSubMch = true): array
    {
        // Inject the collection app id so all signed calls include app_id in the encrypted
        // TreeMap. Callers (e.g. disbursement) override via $appId where a different id applies.
        $businessParams['app_id'] = $appId ?? $this->collectionAppId;

        // Every transactional call speaks for the site's sub-merchant, so the id is
        // injected here rather than repeated at ~30 call sites. An explicit value
        // from the caller (the operator tools accept one) still wins, and blank
        // falls out in the array_filter below — i.e. main-merchant behaviour.
        // $withSubMch is false only where the field is meaningless: the
        // sub-merchant REGISTRATION query, which is addressed to the parent.
        if ($withSubMch) {
            $businessParams['sub_mch_id'] = $businessParams['sub_mch_id'] ?? $this->subMchId;
        }

        // Monetapay omits blank fields from the signed TreeMap; mirror that so
        // our local sign matches what the gateway recomputes on its side.
        // Arrays are excluded here — nested structures must go in $plainBody instead.
        $businessParams = array_filter(
            $businessParams,
            static fn ($value) => $value !== null && $value !== '' && ! is_array($value)
        );

        ksort($businessParams);

        $buffer = '';
        foreach ($businessParams as $key => $value) {
            $buffer .= $key.'='.(string) $value.'__';
        }
        $strMap = $buffer === '' ? '' : substr($buffer, 0, -2);

        $timestamp = (string) time();

        // Disbursement uses the same credentials as collection unless explicitly overridden.
        // PHP-level ?: fallback ensures collection creds are used when disbursement-specific
        // ones are empty (e.g. config cache built before MONETAPAY_DISBURSEMENT_* were added).
        $token = $forDisbursement ? ($this->disbursementToken ?: $this->token) : $this->token;
        $partnerKey = $forDisbursement ? ($this->disbursementPartnerKey ?: $this->partnerKey) : $this->partnerKey;
        $aesKey = $forDisbursement ? ($this->disbursementAesKey ?: null) : null;
        $aesIv = $forDisbursement ? ($this->disbursementAesIv ?: null) : null;

        if (! $forDisbursement && $token === '') {
            Log::channel('monetapay')->warning('postSigned: MONETAPAY_TOKEN is not set — signature will be invalid', [
                'endpoint' => $endpointSuffix,
            ]);
        }

        $originalString = $token.'*|*'.$strMap.'@!@'.$timestamp;
        $sign = md5(md5($originalString));

        $strToEncrypt = $strMap === ''
            ? 'sign='.$sign.'__timestamp='.$timestamp
            : $strMap.'__sign='.$sign.'__timestamp='.$timestamp;

        $enData = $aesKey !== null && $aesKey !== ''
            ? base64_encode(openssl_encrypt($strToEncrypt, 'AES-128-CBC', $this->deriveAesParam($aesKey), OPENSSL_RAW_DATA, $this->deriveAesParam($aesIv)))
            : $this->encryptPayload($strToEncrypt);

        if ($forDisbursement) {
            Log::channel('monetapay')->debug('[Disbursement] postSigned pre-flight', [
                'endpoint' => $endpointSuffix,
                'app_id' => $businessParams['app_id'] ?? '(missing)',
                'partner_key_set' => $partnerKey !== '',
                'token_set' => $token !== '',
                'aes_key_set' => ($aesKey ?? '') !== '',
                'aes_iv_set' => ($aesIv ?? '') !== '',
                'strMap' => $strMap,
            ]);
        }

        $response = $this->client()->post($this->baseUrl.$endpointSuffix, array_merge([
            'data' => [
                'partner_key' => $partnerKey,
                'en_data' => $enData,
            ],
        ], $plainBody));

        return $this->parseResponse($endpointSuffix, $response, $passthrough);
    }

    /**
     * POST a plain (non-encrypted) JSON body. A handful of Monetapay endpoints
     * (payin query, cdm query, merchant permission) accept raw params.
     *
     * @param  array<string,mixed>  $body
     */
    private function postPlain(string $endpointSuffix, array $body): array
    {
        $body = array_filter($body, static fn ($value) => $value !== null && $value !== '');

        $response = $this->client()->post($this->baseUrl.$endpointSuffix, $body);

        return $this->parseResponse($endpointSuffix, $response);
    }

    /**
     * Shared HTTP failure handling + JSON decoding for the helpers above.
     */
    private function parseResponse(string $endpointSuffix, Response $response, bool $passthrough = false): array
    {
        if ($response->failed()) {
            $error = $response->json();
            $message = $error['message'] ?? $error['msg'] ?? $response->body();

            Log::channel('monetapay')->error('Monetapay request failed', [
                'endpoint' => $endpointSuffix,
                'status' => $response->status(),
                'response' => $error,
            ]);

            if (! $passthrough) {
                throw new Exception("Monetapay API Error [HTTP {$response->status()}]: {$message}");
            }

            return $response->json() ?? [];
        }

        Log::channel('monetapay')->info('Monetapay request OK', [
            'endpoint' => $endpointSuffix,
            'response' => $response->json(),
        ]);

        return $response->json() ?? [];
    }

    /* =====================================================================
     | 5. Balance
     * ===================================================================== */

    /**
     * 5.1 Balance Inquiry — POST /v1.0.0/balance
     *
     * A null $subMchId means "whichever merchant this site trades as": postSigned
     * fills in the configured sub-merchant, falling back to the main merchant when
     * none is set. Pass a value only to inspect a DIFFERENT sub-merchant.
     */
    public function inquiryBalance(?string $subMchId = null, ?string $currency = null): array
    {
        return $this->postSigned('/v1.0.0/balance', [
            'sub_mch_id' => $subMchId,
            'currency' => $currency,
        ]);
    }

    /**
     * 5.1 Balance Inquiry for the PARENT (main merchant) account.
     *
     * The only difference from inquiryBalance() is `withSubMch: false`: it stops
     * postSigned() injecting the configured sub-merchant, so the request asks the
     * gateway for the parent account this site trades under — Uxio's own balance,
     * not the sub-merchant's. Passing a blank `sub_mch_id` instead would NOT work,
     * because postSigned would fill it in from config.
     */
    public function inquiryMainMerchantBalance(?string $currency = null): array
    {
        return $this->postSigned('/v1.0.0/balance', [
            'currency' => $currency,
        ], withSubMch: false);
    }

    /**
     * Balance via a short shared cache. The admin's financial/integration panels
     * (and the 30s integration poll) read this; caching keeps them from hitting
     * Monetapay live on every request — the call that otherwise hangs the server
     * when the gateway is slow.
     *
     * The cache key includes the sub-merchant id and currency: with per-client
     * sub-merchants, a fixed key would hand every caller the FIRST queried
     * sub-merchant's balance for the next 60s — no error, just a wrong number
     * that looks plausible. `main` stands in for the main-merchant (null) query
     * so it can never collide with a real sub_mch_id.
     *
     * @return array<string,mixed>
     */
    public function inquiryBalanceCached(?string $subMchId = null, ?string $currency = null): array
    {
        return Cache::remember(
            self::balanceCacheKey($subMchId, $currency),
            self::BALANCE_CACHE_TTL,
            fn () => $this->inquiryBalance($subMchId, $currency),
        );
    }

    /**
     * The per-(sub-merchant, currency) cache key — public so cache-busting
     * callers (integration ping / credential update) forget the same entry
     * this class writes, instead of a stale literal.
     *
     * A null $subMchId resolves through the SAME default the request itself uses
     * (configured sub-merchant, else the main merchant). Without that, an omitted
     * argument would key the site's own balance under `main` while every caller
     * that spelled the sub-merchant out looked somewhere else — two cache entries
     * for one number, each able to go stale independently.
     */
    public static function balanceCacheKey(?string $subMchId = null, ?string $currency = null): string
    {
        $subMchId = $subMchId ?: (string) (IntegrationConfig::for('monetapay')['sub_mch_id'] ?? '');

        return self::BALANCE_CACHE_KEY.':'.($subMchId !== '' ? $subMchId : 'main').':'.($currency ?? 'IDR');
    }

    /**
     * The main-merchant reading, via the same short cache as the sub-merchant.
     *
     * Its own key namespace (`MAIN_BALANCE_CACHE_KEY`), never `balanceCacheKey()`:
     * that helper folds a null sub-merchant into the CONFIGURED sub-merchant and
     * would key the parent account's balance under the sub-merchant's id.
     *
     * @return array<string,mixed>
     */
    public function inquiryMainMerchantBalanceCached(?string $currency = null): array
    {
        return Cache::remember(
            self::mainBalanceCacheKey($currency),
            self::BALANCE_CACHE_TTL,
            fn () => $this->inquiryMainMerchantBalance($currency),
        );
    }

    /** The main-merchant (parent account) cache key — public so busters forget the same entry. */
    public static function mainBalanceCacheKey(?string $currency = null): string
    {
        return self::MAIN_BALANCE_CACHE_KEY.':'.($currency ?? 'IDR');
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
        return $this->postSigned('/v1.0.0/subMch/registration/query', $params, withSubMch: false);
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
        // order_items must be SIGNED: JSON-encode it to a string so it joins the
        // encrypted TreeMap inside en_data (Monetapay only reads signed fields).
        if (! empty($params['order_items']) && is_array($params['order_items'])) {
            $params['order_items'] = json_encode($params['order_items']);
        }

        return $this->postSigned('/v1.0.0/subscription/apply', $params, passthrough: true);
    }

    /** 6.5.2 Subscription Create — POST /v1.0.0/subscription/create */
    public function createSubscription(array $params): array
    {
        // order_items must be SIGNED: JSON-encode it to a string so it joins the
        // encrypted TreeMap inside en_data (Monetapay only reads signed fields).
        if (! empty($params['order_items']) && is_array($params['order_items'])) {
            $params['order_items'] = json_encode($params['order_items']);
        }

        return $this->postSigned('/v1.0.0/subscription/create', $params, passthrough: true);
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
        $this->guardDisbursementCredentials();

        return $this->postSigned('/v1.0.0/disbursement', $params, passthrough: true, appId: $this->disbursementAppId, forDisbursement: true);
    }

    /** 7.2.1 Large Payout Create — POST /v1.0.0/disbursement/large */
    public function createLargePayout(array $params): array
    {
        $this->guardDisbursementCredentials();

        return $this->postSigned('/v1.0.0/disbursement/large', $params, passthrough: true, appId: $this->disbursementAppId, forDisbursement: true);
    }

    /** 7.3.1 EWallet Payout Create — POST /v1.0.0/ewallet-disbursement */
    public function createEwalletPayout(array $params): array
    {
        $this->guardDisbursementCredentials();

        return $this->postSigned('/v1.0.0/ewallet-disbursement', $params, passthrough: true, appId: $this->disbursementAppId, forDisbursement: true);
    }

    /** 7.4.1 Payout Order Inquiry — POST /v1.0.0/disbursement/query */
    public function inquiryDisbursement(array $params): array
    {
        $this->guardDisbursementCredentials();

        return $this->postSigned('/v1.0.0/disbursement/query', $params, appId: $this->disbursementAppId, forDisbursement: true);
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

    /**
     * The customer phone Monetapay is given, in the Indonesian local form.
     *
     * Contact phones are stored as E.164 for any country now, but Monetapay
     * settles in IDR to Indonesian banks and e-wallets — and on an e-wallet
     * charge this field IS the wallet identity. A foreign number here would be
     * rejected by the gateway, so it degrades to the same placeholder this
     * field has always defaulted to rather than being passed through.
     *
     * (Indonesian numbers already reached this code as `+62…` from the
     * storefront, so this narrows what is sent rather than changing it.)
     *
     * @param  array<string, mixed>  $customerData
     */
    private static function indonesianAccountPhone(array $customerData): string
    {
        $phone = $customerData['customer_phone'] ?? null;

        return Phone::toIndonesianLocal(is_string($phone) ? $phone : null) ?? '08123456789';
    }
}
