<?php

namespace App\Actions\Integration;

use App\Contracts\PaymentGateway;
use App\Models\IntegrationCredential;
use App\Support\Integration\IntegrationConfig;
use Illuminate\Support\Facades\Cache;

/**
 * Persist edited credentials for a provider (encrypted at rest via the model
 * cast). Write-only secrets: a secret field is only overwritten when a new
 * non-empty value is supplied; blank leaves the stored value untouched.
 * Non-secret fields are always taken from the request. Busts the balance cache
 * so the next status read reflects the change.
 */
class UpdateIntegrationCredentialAction
{
    public function execute(string $provider, array $input, ?int $userId = null): IntegrationCredential
    {
        $fields = config("integrations.{$provider}.fields", []);
        $merged = IntegrationConfig::stored($provider); // existing DB creds only

        foreach ($fields as $field) {
            $key = $field['key'];
            $type = $field['type'];
            $isSecret = (bool) $field['secret'];
            $hasValue = array_key_exists($key, $input) && $input[$key] !== null && $input[$key] !== '';

            if ($type === 'boolean') {
                if (array_key_exists($key, $input)) {
                    $merged[$key] = filter_var($input[$key], FILTER_VALIDATE_BOOLEAN);
                }

                continue;
            }

            if ($isSecret) {
                // Only replace when a new secret is actually typed (write-only).
                if ($hasValue) {
                    $merged[$key] = (string) $input[$key];
                }

                continue;
            }

            if (array_key_exists($key, $input)) {
                $merged[$key] = (string) $input[$key];
            }
        }

        $credential = IntegrationCredential::updateOrCreate(
            ['provider' => $provider],
            [
                'credentials' => $merged,
                'mode' => $this->resolveMode($provider, $merged),
                'is_active' => true,
                'updated_by' => $userId,
            ],
        );

        // Bust the exact key each service caches under. Monetapay's is keyed per
        // sub-merchant/currency and resolved from the credentials just written,
        // so an edited sub_mch_id busts the NEW entry — the one the next read
        // will look in.
        match ($provider) {
            'monetapay' => Cache::forget(app(PaymentGateway::class)->balanceCacheKey()),
            'uxiolabs' => Cache::forget('uxiolabs:balance'),
            default => null,
        };

        return $credential;
    }

    private function resolveMode(string $provider, array $creds): string
    {
        return match ($provider) {
            'monetapay' => filter_var($creds['is_production'] ?? false, FILTER_VALIDATE_BOOLEAN) ? 'production' : 'sandbox',
            default => 'production',
        };
    }
}
