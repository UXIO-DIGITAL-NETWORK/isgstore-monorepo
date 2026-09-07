<?php

namespace App\Services;

use App\Support\Integration\IntegrationConfig;
use Exception;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * PiWAPI WhatsApp gateway. Used to deliver the purchase receipt (bukti
 * pembayaran) as a document message with the invoice PDF attached.
 *
 * Credentials are DB-backed (admin Integration page) merged over config/.env
 * via IntegrationConfig — an edit takes effect without a redeploy. When the
 * account/secret are unset the service reports `isConfigured() === false` so the
 * caller can skip sending instead of hitting the API with blank credentials.
 */
class PiWapiService
{
    /** Outbound HTTP bounds — without these a slow/unreachable gateway hangs the worker forever. */
    private const HTTP_TIMEOUT = 15;

    private const HTTP_CONNECT_TIMEOUT = 5;

    private string $apiUrl;

    private string $account;

    private string $secret;

    public function __construct()
    {
        $cfg = IntegrationConfig::for('piwapi');

        $this->apiUrl = (string) ($cfg['api_url'] ?? 'https://piwapi.com/api/send/whatsapp');
        $this->account = (string) ($cfg['account'] ?? '');
        $this->secret = (string) ($cfg['secret'] ?? '');
    }

    /** True only when both credentials are present — otherwise sending is a no-op. */
    public function isConfigured(): bool
    {
        return $this->account !== '' && $this->secret !== '';
    }

    /** A pending HTTP request with sane timeouts, so a stalled upstream fails fast instead of hanging the worker. */
    private function client(): PendingRequest
    {
        return Http::timeout(self::HTTP_TIMEOUT)->connectTimeout(self::HTTP_CONNECT_TIMEOUT);
    }

    /**
     * Send a `document` WhatsApp message: the PDF is fetched by PiWAPI from
     * $documentUrl (which must be publicly reachable), with $caption as the
     * accompanying text. Throws on transport failure or a non-success body so
     * the queued job can retry.
     *
     * @return array<string, mixed> the decoded PiWAPI response
     */
    public function sendDocument(string $recipient, string $documentUrl, string $documentName, string $caption): array
    {
        $payload = [
            'secret' => $this->secret,
            'account' => $this->account,
            'recipient' => $recipient,
            'type' => 'document',
            'message' => $caption,
            'document_url' => $documentUrl,
            'document_name' => $documentName,
            'document_type' => 'pdf',
            'priority' => 1,
        ];

        // [CHECKPOINT 1] Pre-request — never log the secret.
        Log::channel('piwapi')->info('PiWAPI sendDocument Request', [
            'recipient' => $recipient,
            'document_url' => $documentUrl,
            'document_name' => $documentName,
        ]);

        return $this->send('sendDocument', $recipient, $payload);
    }

    /**
     * Send a plain `text` WhatsApp message. Used for notifications that carry a
     * link rather than a document — the guest refund claim, for one.
     *
     * Same contract as sendDocument(): throws on transport failure or a
     * non-success body so a queued caller can retry.
     *
     * @return array<string, mixed> the decoded PiWAPI response
     */
    public function sendText(string $recipient, string $message): array
    {
        $payload = [
            'secret' => $this->secret,
            'account' => $this->account,
            'recipient' => $recipient,
            'type' => 'text',
            'message' => $message,
            'priority' => 1,
        ];

        // Never log the secret, and never the message body — a claim link is a
        // bearer credential and log files outlive the refund.
        Log::channel('piwapi')->info('PiWAPI sendText Request', [
            'recipient' => $recipient,
        ]);

        return $this->send('sendText', $recipient, $payload);
    }

    /**
     * POST a prepared payload and validate PiWAPI's two-layer response.
     *
     * Shared by every message type so the "200 HTTP but a business error in the
     * body" case cannot be handled correctly in one method and forgotten in the
     * next.
     *
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function send(string $label, string $recipient, array $payload): array
    {
        try {
            $response = $this->client()->asMultipart()->post($this->apiUrl, $this->multipart($payload));

            if (! $response->successful()) {
                Log::channel('piwapi')->error("PiWAPI {$label} HTTP Failed", [
                    'http_status' => $response->status(),
                    'recipient' => $recipient,
                    'response' => $response->body(),
                ]);

                throw new Exception('PiWAPI Error: '.$response->body());
            }

            $data = (array) $response->json();

            // PiWAPI answers 200 with a `status` field; anything other than 200
            // in the body is a business-level failure (bad number, no session…).
            if (($data['status'] ?? null) !== 200) {
                Log::channel('piwapi')->error("PiWAPI {$label} Rejected", [
                    'recipient' => $recipient,
                    'response' => $data,
                ]);

                throw new Exception('PiWAPI rejected the message: '.($data['message'] ?? 'unknown error'));
            }

            Log::channel('piwapi')->info("PiWAPI {$label} Response", [
                'recipient' => $recipient,
                'message_id' => $data['data']['messageId'] ?? null,
            ]);

            return $data;
        } catch (Exception $e) {
            Log::channel('piwapi')->error("PiWAPI {$label} Exception", [
                'recipient' => $recipient,
                'message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Laravel's Http::asMultipart() wants a list of {name, contents} parts.
     *
     * @param  array<string, mixed>  $payload
     * @return list<array{name: string, contents: string}>
     */
    private function multipart(array $payload): array
    {
        $parts = [];
        foreach ($payload as $name => $contents) {
            $parts[] = ['name' => $name, 'contents' => (string) $contents];
        }

        return $parts;
    }
}
