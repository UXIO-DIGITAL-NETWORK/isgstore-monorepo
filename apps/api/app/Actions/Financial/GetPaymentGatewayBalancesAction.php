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
 * Monetapay's exact balance response schema hasn't been verified against a
 * real account yet (v1.0.0/sub_mch_id suggests a BI SNAP-style payload —
 * `balanceInfos: [{balanceType, amount: {value}}]` — assumed here as a
 * first pass). `raw` is always included so the real shape can be confirmed
 * and this extraction corrected without losing data in the meantime.
 */
class GetPaymentGatewayBalancesAction
{
    public function __construct(private readonly MonetapayService $monetapayService) {}

    public function execute(): array
    {
        try {
            $response = $this->monetapayService->inquiryBalance();
        } catch (Exception $e) {
            Log::warning('GetPaymentGatewayBalancesAction: Monetapay balance inquiry failed', [
                'message' => $e->getMessage(),
            ]);

            return [[
                'id' => 'monetapay',
                'name' => 'Monetapay',
                'active_balance' => null,
                'held_balance' => null,
                'raw' => null,
            ]];
        }

        return [[
            'id' => 'monetapay',
            'name' => 'Monetapay',
            'active_balance' => $this->extractBalance($response, 'AVAILABLE'),
            'held_balance' => $this->extractBalance($response, 'HOLD'),
            'raw' => $response,
        ]];
    }

    private function extractBalance(array $response, string $balanceType): ?float
    {
        $infos = $response['balanceInfos'] ?? $response['body']['balanceInfos'] ?? null;

        if (! is_array($infos)) {
            return null;
        }

        foreach ($infos as $info) {
            if (($info['balanceType'] ?? null) === $balanceType) {
                $amount = $info['amount']['value'] ?? $info['amount'] ?? null;

                return is_numeric($amount) ? (float) $amount : null;
            }
        }

        return null;
    }
}
