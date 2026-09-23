<?php

namespace App\Actions\Financial;

use App\Services\Payment\MonetapayService;
use Exception;
use Illuminate\Support\Facades\Log;

/**
 * There is exactly one live payment gateway integration (Monetapay) —
 * the many `payment_channels` rows are payment METHODS (VA/QRIS/e-wallet)
 * under that one merchant account, not separate gateways with their own
 * balances. Returns a single-element array so the admin UI's list shape
 * stays stable if a second gateway is ever added.
 *
 * Response shape (Monetapay 5.1 Balance Inquiry):
 *   { code, messgae, data: { current_balance: "…", current_freeze: "…" } }
 * `current_balance`/`current_freeze` are numeric STRINGS. `raw` is kept so the
 * real payload is always inspectable.
 */
class GetPaymentGatewayBalancesAction
{
    public function __construct(private readonly MonetapayService $monetapayService) {}

    public function execute(): array
    {
        try {
            // Cached (60s) so the admin panel + integration poll never hit Monetapay
            // live on every request — that live call is what hangs the server.
            $response = $this->monetapayService->inquiryBalanceCached();
        } catch (Exception $e) {
            Log::warning('GetPaymentGatewayBalancesAction: Monetapay balance inquiry failed', [
                'message' => $e->getMessage(),
            ]);

            return [[
                'id' => 'monetapay',
                'name' => 'Payment Gateway',
                'active_balance' => null,
                'held_balance' => null,
                'raw' => null,
            ]];
        }

        return [[
            'id' => 'monetapay',
            'name' => 'Payment Gateway',
            'active_balance' => $this->extractBalance($response, 'current_balance'),
            'held_balance' => $this->extractBalance($response, 'current_freeze'),
            'raw' => $response,
        ]];
    }

    /**
     * Reads a numeric-string balance field from the `data` object. Returns null
     * when the field is absent or non-numeric — i.e. a business-error response
     * (which omits `data`) reads as "disconnected" rather than throwing.
     */
    private function extractBalance(array $response, string $key): ?float
    {
        $data = $response['data'] ?? $response['body']['data'] ?? null;

        if (! is_array($data)) {
            return null;
        }

        $value = $data[$key] ?? null;

        return is_numeric($value) ? (float) $value : null;
    }
}
