<?php

namespace App\Actions\Integration;

use App\Actions\Financial\GetPaymentGatewayBalancesAction;
use App\Actions\Financial\GetSupplierBalancesAction;
use App\Support\Integration\IntegrationConfig;
use App\Support\Uxiolabs\UxiolabsSupplier;

/**
 * Connectivity overview for the Integration page — composes the same
 * balance checks Financial uses (a successful balance read implies the
 * channel is reachable) rather than duplicating the uxiolabs/Monetapay
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
            ...$this->whatsappChannels(),
        ];
    }

    /**
     * WhatsApp gateway (PiWAPI) has no balance to probe, so reachability is just
     * "are the credentials filled in" — connected once account + secret are set.
     */
    private function whatsappChannels(): array
    {
        $cfg = IntegrationConfig::for('piwapi');
        $configured = ! empty($cfg['account']) && ! empty($cfg['secret']);

        return [[
            'id' => 'piwapi',
            'provider' => 'piwapi',
            'type' => 'whatsapp_gateway',
            'name' => (string) config('integrations.piwapi.label', 'PiWAPI (WhatsApp)'),
            'connection_status' => $configured ? 'connected' : 'disconnected',
            'balance' => null,
            'mode' => null,
            'last_ping_at' => now()->toIso8601String(),
        ]];
    }

    private function supplierChannels(): array
    {
        // Matched on the supplier's NAME, which is stored data on a row the whole
        // pipeline resolves by it — and it has been renamed twice. Recognising
        // every spelling is what stops a rename from silently dropping the balance
        // off this card (no error, just an empty figure).
        $uxiolabs = collect($this->supplierBalances->execute())
            ->first(fn (array $row) => UxiolabsSupplier::isNamed($row['name']));

        if (! $uxiolabs) {
            return [];
        }

        return [[
            'id' => 'uxiolabs',
            'provider' => 'uxiolabs',
            'type' => 'supplier',
            'name' => $uxiolabs['name'],
            'connection_status' => $uxiolabs['balance'] !== null ? 'connected' : 'disconnected',
            'balance' => $uxiolabs['balance'],
            // uxiolabs has a single API key — no dev/prod mode split.
            'mode' => 'production',
            'last_ping_at' => now()->toIso8601String(),
        ]];
    }

    private function gatewayChannels(): array
    {
        // A successful balance read still tells us the gateway is reachable, but
        // the amount is deliberately NOT exposed — the admin panel only needs the
        // connected/disconnected status for a payment gateway, not its float.
        return collect($this->gatewayBalances->execute())
            ->map(fn (array $gateway) => [
                'id' => $gateway['id'],
                'provider' => $gateway['id'],
                'type' => 'payment_gateway',
                'name' => $gateway['name'],
                'connection_status' => $gateway['active_balance'] !== null ? 'connected' : 'disconnected',
                'balance' => null,
                'mode' => filter_var(IntegrationConfig::for($gateway['id'])['is_production'] ?? false, FILTER_VALIDATE_BOOLEAN) ? 'production' : 'sandbox',
                'last_ping_at' => now()->toIso8601String(),
            ])
            ->all();
    }
}
