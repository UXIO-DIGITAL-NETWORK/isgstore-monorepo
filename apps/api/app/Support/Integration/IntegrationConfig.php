<?php

declare(strict_types=1);

namespace App\Support\Integration;

use App\Models\IntegrationCredential;
use Throwable;

/**
 * Effective config for an integration provider: DB credentials (editable from
 * the admin UI) merged OVER `config('services.<provider>')` (env defaults).
 *
 * A DB key with a non-empty value wins; anything unset falls back to env, so an
 * empty table behaves exactly like before this feature. Services read through
 * here instead of raw `config()` so an edit takes effect without a redeploy.
 */
final class IntegrationConfig
{
    /** @return array<string, mixed> */
    public static function for(string $provider): array
    {
        $base = (array) config("services.{$provider}", []);

        $overrides = array_filter(
            self::stored($provider),
            static fn ($value) => $value !== null && $value !== '',
        );

        return array_merge($base, $overrides);
    }

    /**
     * The raw stored credentials (decrypted), or [] when none saved. Resilient
     * to the table not existing yet (fresh DB / mid-migration boot) so a service
     * constructed during migrations falls back to config instead of throwing.
     */
    public static function stored(string $provider): array
    {
        try {
            $row = IntegrationCredential::query()->where('provider', $provider)->first();

            return (array) ($row?->credentials ?? []);
        } catch (Throwable) {
            return [];
        }
    }
}
