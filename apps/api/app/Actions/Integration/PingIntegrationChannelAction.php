<?php

namespace App\Actions\Integration;

use App\Contracts\PaymentGateway;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

/**
 * Force-refresh a channel's status + balance: drop the 60s balance cache so the
 * next read hits the provider live, then return the freshly-computed channel row.
 */
class PingIntegrationChannelAction
{
    public function __construct(private readonly GetIntegrationChannelsAction $channels) {}

    public function execute(string $provider): ?array
    {
        if (! config("integrations.{$provider}")) {
            return null;
        }

        // Bust the exact key each service caches under. Monetapay's is keyed
        // per (sub-merchant, currency); the integration panel reads the
        // main-merchant entry, so that's the one to forget.
        match ($provider) {
            'monetapay' => Cache::forget(app(PaymentGateway::class)->balanceCacheKey()),
            'uxiolabs' => Cache::forget('uxiolabs:balance'),
            default => null,
        };

        return (new Collection($this->channels->execute()))->firstWhere('id', $provider);
    }
}
