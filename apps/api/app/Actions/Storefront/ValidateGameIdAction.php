<?php

declare(strict_types=1);

namespace App\Actions\Storefront;

use App\Models\Category;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Resolve a player's in-game nickname from their id.
 *
 * `categories.validasi_nickname` names the provider to ask. Most games have no
 * provider configured, and that is a normal state — not an error:
 *
 *   - unconfigured game  → {nickname: null, validated: false, supported: false}
 *   - provider says no   → {nickname: null, validated: false, supported: true}
 *   - provider errors    → same as unconfigured, plus a log line
 *
 * This endpoint MUST NOT be able to block a purchase. A customer whose game has
 * no lookup provider, or whose provider is down, still has to be able to buy —
 * so every failure path degrades to "no nickname" and checkout carries on. The
 * storefront simply hides the nickname line when it is null.
 */
class ValidateGameIdAction
{
    private const TIMEOUT_SECONDS = 4;

    /** @return array{nickname: string|null, validated: bool, supported: bool} */
    public function execute(Category $game, string $userId, ?string $serverId): array
    {
        $provider = trim((string) $game->validasi_nickname);

        if ($provider === '') {
            return $this->unsupported();
        }

        // Providers are configured as a URL template so a new game needs a data
        // change, not a deploy. Anything else is an unrecognised provider name.
        if (! str_starts_with($provider, 'http://') && ! str_starts_with($provider, 'https://')) {
            return $this->unsupported();
        }

        try {
            $response = Http::timeout(self::TIMEOUT_SECONDS)
                ->acceptJson()
                ->get($this->buildUrl($provider, $userId, $serverId));

            if ($response->failed()) {
                return ['nickname' => null, 'validated' => false, 'supported' => true];
            }

            $nickname = $this->extractNickname($response->json());

            return [
                'nickname' => $nickname,
                'validated' => $nickname !== null,
                'supported' => true,
            ];
        } catch (Throwable $e) {
            // Never rethrow: a provider outage must not take checkout down.
            Log::warning('Game id validation failed', [
                'game' => $game->code,
                'error' => $e->getMessage(),
            ]);

            return $this->unsupported();
        }
    }

    private function buildUrl(string $template, string $userId, ?string $serverId): string
    {
        $replaced = strtr($template, [
            '{user_id}' => rawurlencode($userId),
            '{server_id}' => rawurlencode((string) $serverId),
            '{customer_no}' => rawurlencode($userId.(string) $serverId),
        ]);

        // No placeholders in the template → append the pair as query params so a
        // plain endpoint URL still works.
        if ($replaced === $template) {
            $separator = str_contains($template, '?') ? '&' : '?';
            $replaced = $template.$separator.http_build_query(array_filter([
                'user_id' => $userId,
                'server_id' => $serverId,
            ]));
        }

        return $replaced;
    }

    /**
     * Providers disagree on where the nickname lives; probe the common keys
     * rather than committing to one vendor's envelope.
     */
    private function extractNickname(mixed $payload): ?string
    {
        if (! is_array($payload)) {
            return null;
        }

        foreach (['nickname', 'username', 'name', 'player_name'] as $key) {
            $value = data_get($payload, $key) ?? data_get($payload, "data.{$key}");

            if (is_string($value) && trim($value) !== '') {
                return trim($value);
            }
        }

        return null;
    }

    /** @return array{nickname: null, validated: false, supported: false} */
    private function unsupported(): array
    {
        return ['nickname' => null, 'validated' => false, 'supported' => false];
    }
}
