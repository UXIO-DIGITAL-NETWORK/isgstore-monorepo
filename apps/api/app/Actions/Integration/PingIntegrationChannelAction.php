<?php

namespace App\Actions\Integration;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

/**
 * Force-refresh a channel's status + balance: drop the 60s balance cache so the
 * next read hits the provider live, then return the freshly-computed channel row.
 */
class PingIntegrationChannelAction
{
    private const BALANCE_CACHE_KEYS = [
        'monetapay' => 'monetapay:balance',
        'uxiotopup' => 'uxiotopup:balance',
    ];

    public function __construct(private readonly GetIntegrationChannelsAction $channels) {}

    public function execute(string $provider): ?array
    {
        if (! config("integrations.{$provider}")) {
            return null;
        }

        if (isset(self::BALANCE_CACHE_KEYS[$provider])) {
            Cache::forget(self::BALANCE_CACHE_KEYS[$provider]);
        }

        return (new Collection($this->channels->execute()))->firstWhere('id', $provider);
    }
}
