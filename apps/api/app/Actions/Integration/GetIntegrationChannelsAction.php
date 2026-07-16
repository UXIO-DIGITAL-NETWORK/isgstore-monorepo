<?php

namespace App\Actions\Integration;

use App\Actions\Financial\GetPaymentGatewayBalancesAction;
use App\Actions\Financial\GetSupplierBalancesAction;

/**
 * Connectivity overview for the Integration page — composes the same
 * balance checks Financial uses (a successful balance read implies the
 * channel is reachable) rather than duplicating the Digiflazz/Monetapay
 * calls. Only reports channels with a real backend integration: there is
 * no WhatsApp/email gateway model in this system, so those channel types
 * never appear here (the frontend's own type anticipates them, but nothing
 * backs them yet — confirm scope before building that out).
 */
class GetIntegrationChannelsAction
{
    public function __construct(
        private readonly GetSupplierBalancesAction $supplierBalances,
        private readonly GetPaymentGatewayBalancesAction $gatewayBalances,
    ) {}

    public function execute(): array
    {
        return [
            ...$this->supplierChannels(),
            ...$this->gatewayChannels(),
        ];
    }

    private function supplierChannels(): array
    {
        $digiflazz = collect($this->supplierBalances->execute())
            ->first(fn (array $row) => strtolower($row['name']) === 'digiflazz');

        if (! $digiflazz) {
            return [];
        }

        return [[
            'id' => 'digiflazz',
            'type' => 'supplier',
            'name' => $digiflazz['name'],
            'connection_status' => $digiflazz['balance'] !== null ? 'connected' : 'disconnected',
            'balance' => $digiflazz['balance'],
            'last_ping_at' => now()->toIso8601String(),
        ]];
    }

    private function gatewayChannels(): array
    {
        return collect($this->gatewayBalances->execute())
            ->map(fn (array $gateway) => [
                'id' => $gateway['id'],
                'type' => 'payment_gateway',
                'name' => $gateway['name'],
                'connection_status' => $gateway['active_balance'] !== null ? 'connected' : 'disconnected',
                'balance' => $gateway['active_balance'],
                'last_ping_at' => now()->toIso8601String(),
            ])
            ->all();
    }
}
