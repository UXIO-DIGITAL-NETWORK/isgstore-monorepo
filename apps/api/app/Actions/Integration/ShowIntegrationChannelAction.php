<?php

namespace App\Actions\Integration;

use App\Support\Integration\IntegrationConfig;
use Illuminate\Support\Collection;

/**
 * Detail view for one integration channel: live status + balance, mode,
 * endpoint, and the provider's credential field schema with values MASKED —
 * secrets never leave the server in plaintext (write-only from the UI's side).
 */
class ShowIntegrationChannelAction
{
    public function __construct(private readonly GetIntegrationChannelsAction $channels) {}

    public function execute(string $provider): ?array
    {
        $meta = config("integrations.{$provider}");
        if (! $meta) {
            return null;
        }

        /** @var array<string,mixed>|null $channel */
        $channel = (new Collection($this->channels->execute()))->firstWhere('id', $provider);
        $effective = IntegrationConfig::for($provider);

        $fields = array_map(function (array $field) use ($effective) {
            $value = $effective[$field['key']] ?? null;

            return [
                'key' => $field['key'],
                'label' => $field['label'],
                'type' => $field['type'],
                'secret' => (bool) $field['secret'],
                // Secrets are masked; booleans normalised; everything else as-is.
                'value' => $field['secret']
                    ? self::mask($value)
                    : ($field['type'] === 'boolean' ? filter_var($value, FILTER_VALIDATE_BOOLEAN) : $value),
            ];
        }, $meta['fields']);

        return [
            'id' => $provider,
            'provider' => $provider,
            'name' => $meta['label'],
            'type' => $meta['type'],
            'connection_status' => $channel['connection_status'] ?? 'disconnected',
            'balance' => $channel['balance'] ?? null,
            'mode' => $channel['mode'] ?? null,
            'endpoint' => self::endpoint($provider, $effective),
            'last_ping_at' => $channel['last_ping_at'] ?? now()->toIso8601String(),
            'fields' => $fields,
        ];
    }

    /** ••••1234 for a set secret; null when unset. */
    private static function mask(mixed $value): ?string
    {
        $value = (string) $value;
        if ($value === '') {
            return null;
        }

        return '••••'.substr($value, -4);
    }

    private static function endpoint(string $provider, array $cfg): ?string
    {
        return match ($provider) {
            'monetapay' => filter_var($cfg['is_production'] ?? false, FILTER_VALIDATE_BOOLEAN)
                ? 'https://api.monetapay.net'
                : 'https://sandbox-api.monetapay.net',
            'uxiolabs' => (string) ($cfg['base_url'] ?? 'https://api.uxiotopup.id'),
            'piwapi' => (string) ($cfg['api_url'] ?? 'https://piwapi.com/api/send/whatsapp'),
            default => null,
        };
    }
}
