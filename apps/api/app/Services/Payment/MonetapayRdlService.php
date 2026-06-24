<?php

namespace App\Services\Payment;

use Exception;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Monetapay RDL (Rekening Dana Lender) — escrow / P2P-lending API client.
 *
 * This is a SEPARATE product from MonetapayService (the payment/subscription
 * API). Two structural differences drive a dedicated client:
 *
 *   1. Request body is JSON encrypted into en_data (the payment API uses a flat
 *      "key=value__" TreeMap, which cannot carry the nested customer_accounts /
 *      lenders arrays RDL requires).
 *   2. Response envelope is {response_code, response_msg, ...} with an integer
 *      `status` (1=Processing, 2=Success, 3=Failed) — NOT {code, message}.
 *
 * The exact RDL endpoint paths and the precise encryption/signature recipe are
 * not in the SIT sheet; they live in config (placeholders) and a single
 * chokepoint method below. Adjust postSignedJson() once Monetapay confirms the
 * spec — no other code needs to change.
 */
class MonetapayRdlService
{
    private string $baseUrl;

    private string $partnerKey;

    private string $token;

    public function __construct()
    {
        $this->baseUrl = (string) config('services.monetapay_rdl.base_url');
        $this->partnerKey = (string) config('services.monetapay_rdl.partner_key');
        $this->token = (string) config('services.monetapay_rdl.token');
    }

    /* =====================================================================
     | Crypto primitives (mirror MonetapayService, RDL-scoped keys)
     * ===================================================================== */

    /** Pad/trim to exactly 16 bytes with null bytes, matching the official SDK. */
    private function deriveAesParam(?string $value): string
    {
        return substr(str_pad((string) $value, 16, "\0"), 0, 16);
    }

    /** AES-128-CBC encrypt → base64. */
    private function encryptJson(string $json): string
    {
        $key = $this->deriveAesParam(config('services.monetapay_rdl.aes_key'));
        $iv = $this->deriveAesParam(config('services.monetapay_rdl.aes_iv'));

        $encrypted = openssl_encrypt($json, 'AES-128-CBC', $key, OPENSSL_RAW_DATA, $iv);

        return base64_encode($encrypted);
    }

    /* =====================================================================
     | Transport — the single chokepoint
     * ===================================================================== */

    /**
     * Build the JSON-encrypted RDL envelope and POST it.
     *
     * @param  string  $pathKey  key into config('services.monetapay_rdl.paths')
     * @param  array<string,mixed>  $body  business payload (mch_id injected here)
     * @return array<string,mixed> raw decoded RDL response (response_code/...)
     */
    private function postSignedJson(string $pathKey, array $body): array
    {
        $path = config("services.monetapay_rdl.paths.$pathKey");
        if (! $path) {
            throw new Exception("Monetapay RDL path not configured: {$pathKey}");
        }

        // Default the merchant id the gateway expects on every RDL call.
        $body['mch_id'] ??= config('services.monetapay_rdl.mch_id');

        // TODO(monetapay-rdl): confirm against the official RDL spec ─────────
        // Assumptions (single place to change once the spec is available):
        //   • en_data = AES-128-CBC(JSON(body))   ← "Encryption with JSON format"
        //   • sign    = md5(md5(token + "*|*" + JSON(body) + "@!@" + timestamp))
        //   • envelope = { data: { partner_key, en_data, sign?, timestamp? } }
        $json = json_encode($body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $timestamp = (string) time();
        $sign = md5(md5($this->token.'*|*'.$json.'@!@'.$timestamp));
        $enData = $this->encryptJson((string) $json);
        // ────────────────────────────────────────────────────────────────────

        $requestBody = [
            'data' => [
                'partner_key' => $this->partnerKey,
                'en_data' => $enData,
                'sign' => $sign,
                'timestamp' => $timestamp,
            ],
        ];

        $response = Http::post($this->baseUrl.$path, $requestBody);

        return $this->parseResponse($pathKey, $response);
    }

    /**
     * RDL passthrough decode. Unlike the payment API, RDL signals outcome via
     * `response_code` (EB1000/EC1000/EA1000…), so we never gate on {code}. The
     * caller (controller) surfaces the raw body to the tester.
     *
     * @return array<string,mixed>
     */
    private function parseResponse(string $pathKey, Response $response): array
    {
        $decoded = $response->json() ?? [];

        if ($response->failed()) {
            Log::error('Monetapay RDL request failed', [
                'path' => $pathKey,
                'status' => $response->status(),
                'response' => $decoded,
            ]);
        } else {
            Log::info('Monetapay RDL request OK', [
                'path' => $pathKey,
                'response' => $decoded,
            ]);
        }

        return $decoded;
    }

    /* =====================================================================
     | 2.1–2.8 Customer
     * ===================================================================== */

    /** 2.1 / 2.2 / 2.3 Customer Create — registers a lender/borrower + bank accounts. */
    public function createCustomer(array $params): array
    {
        return $this->postSignedJson('customer_create', $params);
    }

    /** 2.4 / 2.5 / 2.6 Customer Inquiry — read status by mch_customer_id / customerId. */
    public function inquiryCustomer(array $params): array
    {
        return $this->postSignedJson('customer_inquiry', $params);
    }

    /** 2.7 / 2.8 Customer Update. */
    public function updateCustomer(array $params): array
    {
        return $this->postSignedJson('customer_update', $params);
    }

    /* =====================================================================
     | 2.10–2.15 VA / Collection
     * ===================================================================== */

    /** 2.10 / 2.11 / 2.12 VA Create — collection account for a registered customer. */
    public function createVa(array $params): array
    {
        return $this->postSignedJson('va_create', $params);
    }

    /** 2.13 / 2.14 / 2.15 VA Inquiry. */
    public function inquiryVa(array $params): array
    {
        return $this->postSignedJson('va_inquiry', $params);
    }

    /* =====================================================================
     | 2.17–2.22 Escrow Disbursement
     * ===================================================================== */

    /** 2.17 / 2.18 / 2.19 Disbursement Create — release loan from lenders → borrower. */
    public function createDisbursement(array $params): array
    {
        return $this->postSignedJson('disbursement_create', $params);
    }

    /** 2.20 / 2.21 / 2.22 Disbursement Inquiry. */
    public function inquiryDisbursement(array $params): array
    {
        return $this->postSignedJson('disbursement_inquiry', $params);
    }
}
