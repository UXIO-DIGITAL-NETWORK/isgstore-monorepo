<?php

declare(strict_types=1);

namespace App\Actions\Storefront;

use App\Models\Category;
use App\Services\CustomerNumberFormatter;
use App\Services\DigiflazzService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Resolve a player's in-game nickname from their id.
 *
 * `categories.validasi_nickname` names the provider to ask. Two provider kinds
 * are understood:
 *
 *   - a URL template (http/https)  → a free third-party lookup endpoint
 *   - `digiflazz:{sku}`            → the paid Digiflazz "cek username" SKU
 *                                    (e.g. `digiflazz:ffusername` for Free Fire),
 *                                    where the account name comes back in the
 *                                    transaction `sn`.
 *
 * Most games have no provider configured, and that is a normal state — not an
 * error:
 *
 *   - unconfigured game  → {nickname: null, validated: false, supported: false}
 *   - provider says no   → {nickname: null, validated: false, supported: true}
 *   - provider errors    → same as unconfigured, plus a log line
 *
 * This endpoint MUST NOT be able to block a purchase. Every failure path
 * degrades to "no nickname" and checkout carries on; the storefront hides the
 * nickname line when it is null.
 */
class ValidateGameIdAction
{
    private const TIMEOUT_SECONDS = 4;

    /** How long a resolved name is reused so a paid check is charged once per id. */
    private const NICKNAME_CACHE_TTL = 1800; // 30 minutes

    public function __construct(
        private readonly DigiflazzService $digiflazzService,
        private readonly CustomerNumberFormatter $customerNumberFormatter,
    ) {}

    /** @return array{nickname: string|null, validated: bool, supported: bool} */
    public function execute(Category $game, string $userId, ?string $serverId): array
    {
        $provider = trim((string) $game->validasi_nickname);

        if ($provider === '') {
            return $this->unsupported();
        }

        // Paid Digiflazz "cek username" SKU — used by games (Free Fire) that have
        // no free public lookup. Configured as `digiflazz:{buyer_sku_code}`.
        if (str_starts_with($provider, 'digiflazz:')) {
            $sku = trim(substr($provider, strlen('digiflazz:')));

            return $sku === '' ? $this->unsupported() : $this->resolveViaDigiflazz($game, $sku, $userId, $serverId);
        }

        // A free third-party URL template. Anything else is an unrecognised
        // provider name (data change, not a deploy).
        if (str_starts_with($provider, 'http://') || str_starts_with($provider, 'https://')) {
            return $this->resolveViaUrl($game, $provider, $userId, $serverId);
        }

        return $this->unsupported();
    }

    /**
     * Look the name up through the Digiflazz cek-username SKU. The result is
     * cached per (game, customer_no); the Digiflazz `ref_id` is deterministic
     * for the day so a repeated check dedupes on their side too — the paid
     * inquiry is charged once, not on every button press.
     *
     * @return array{nickname: string|null, validated: bool, supported: bool}
     */
    private function resolveViaDigiflazz(Category $game, string $sku, string $userId, ?string $serverId): array
    {
        try {
            $customerNo = $this->customerNumberFormatter->format($game, $userId, $serverId);
        } catch (Throwable $e) {
            // Missing required field etc. — not a supported "found nothing", just
            // an incomplete id. Treat as no nickname without charging Digiflazz.
            return ['nickname' => null, 'validated' => false, 'supported' => true];
        }

        $cacheKey = "nickname:{$game->code}:{$customerNo}";

        $cached = Cache::get($cacheKey);
        if (is_string($cached) && $cached !== '') {
            return ['nickname' => $cached, 'validated' => true, 'supported' => true];
        }

        try {
            $refId = 'CEK-'.$sku.'-'.substr(md5($customerNo), 0, 10).'-'.date('Ymd');

            $response = $this->digiflazzService->createTransaction($sku, $customerNo, $refId);
            $nickname = $this->extractDigiflazzNickname($response);

            if ($nickname !== null) {
                Cache::put($cacheKey, $nickname, self::NICKNAME_CACHE_TTL);
            }

            return ['nickname' => $nickname, 'validated' => $nickname !== null, 'supported' => true];
        } catch (Throwable $e) {
            // Never rethrow: a supplier outage must not take checkout down.
            Log::warning('Digiflazz username check failed', [
                'game' => $game->code,
                'error' => $e->getMessage(),
            ]);

            return ['nickname' => null, 'validated' => false, 'supported' => true];
        }
    }

    /** @return array{nickname: string|null, validated: bool, supported: bool} */
    private function resolveViaUrl(Category $game, string $provider, string $userId, ?string $serverId): array
    {
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

    /**
     * Digiflazz cek-username puts the account name in `sn`. A failed check comes
     * back with status "Gagal" (bad id), which is "found nothing", not a name.
     */
    private function extractDigiflazzNickname(array $data): ?string
    {
        if (strtolower((string) ($data['status'] ?? '')) === 'gagal') {
            return null;
        }

        $sn = $data['sn'] ?? null;

        return is_string($sn) && trim($sn) !== '' ? trim($sn) : null;
    }

    /**
     * The name a recent check resolved for this id, read from cache ONLY — never
     * triggers a new (paid) lookup. Lets checkout persist the username even if
     * the client didn't echo the validated value back in its payload.
     */
    public function cachedNickname(Category $game, string $userId, ?string $serverId): ?string
    {
        if (! str_starts_with(trim((string) $game->validasi_nickname), 'digiflazz:')) {
            return null;
        }

        try {
            $customerNo = $this->customerNumberFormatter->format($game, $userId, $serverId);
        } catch (Throwable $e) {
            return null;
        }

        $cached = Cache::get("nickname:{$game->code}:{$customerNo}");

        return is_string($cached) && $cached !== '' ? $cached : null;
    }

    /** @return array{nickname: null, validated: false, supported: false} */
    private function unsupported(): array
    {
        return ['nickname' => null, 'validated' => false, 'supported' => false];
    }
}
