<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;

/**
 * "Is this site allowed to serve the public right now?"
 *
 * Read on every public request, so it is one cached lookup rather than a query
 * — the gate middleware is the first global middleware this app has ever had,
 * and it must not cost a round-trip per request.
 *
 * The answer is written by ApplyHubLicenceAction from what the Hub says, and
 * nothing else may write it. In particular the site never decides for itself
 * that it has lapsed: it can only report what the Hub told it.
 */
final class SiteLicenceState
{
    public const GROUP = 'licence';

    private const CACHE_KEY = 'licence.state';

    private const CACHE_TTL = 60;

    /**
     * Whether the public side is open.
     *
     * **A site with no answer yet is CLOSED.** A fresh deployment, or one whose
     * first sync has not run, has never been told it may serve — and "not yet
     * provisioned" is not the same as "allowed". Only an explicit answer from
     * the Hub opens the door, and that answer then persists until the Hub says
     * otherwise.
     *
     * Note what this deliberately does NOT do: expire an answer after some
     * period of silence. Once the Hub has answered, a serving site STAYS serving
     * when the Hub dies — nothing rewrites the stored answer, so a Hub outage
     * never takes a running storefront down. That safety lives in the
     * persistence of the answer, not in the default.
     */
    public static function isServing(): bool
    {
        return self::read()['is_serving'];
    }

    /**
     * Whether the licence was bought outright — paid once, no end date.
     *
     * Kept beside `is_serving` rather than derived from an empty `ends_at`,
     * because an empty date also means "the Hub has not told us anything yet".
     * Only the Hub sets this, and it only sets it true when a lifetime grant
     * actually happened.
     */
    public static function isLifetime(): bool
    {
        return self::read()['lifetime'];
    }

    /**
     * Why the site is closed, for the 503 body. Never leaks anything the client
     * does not already know about their own account.
     *
     * @return array{status: string, reason: string|null, ends_at: string|null, checkout_url: string|null}
     */
    public static function closure(): array
    {
        $state = self::read();

        return [
            'status' => $state['status'],
            'reason' => $state['suspend_reason'] ?: null,
            'ends_at' => $state['ends_at'] ?: null,
            'checkout_url' => $state['checkout_url'] ?: null,
        ];
    }

    /** Whether the Hub owns this site's licence at all. */
    public static function isManaged(): bool
    {
        return (bool) config('services.hub.enabled')
            && (bool) config('services.hub.managed_licence');
    }

    public static function forget(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    /** @return array{is_serving: bool, lifetime: bool, status: string, suspend_reason: string, ends_at: string, checkout_url: string} */
    private static function read(): array
    {
        return Cache::remember(self::CACHE_KEY, self::CACHE_TTL, function (): array {
            $rows = Setting::where('group', self::GROUP)->get()->keyBy('key');

            return [
                // Absent means "never synced" — which is CLOSED. See isServing().
                'is_serving' => $rows->has('is_serving')
                    ? (bool) $rows->get('is_serving')->typedValue()
                    : false,
                // Absent means "not a lifetime licence" — the ordinary case, and
                // the safe default: a missing answer must never grant forever.
                'lifetime' => $rows->has('lifetime')
                    ? (bool) $rows->get('lifetime')->typedValue()
                    : false,
                'status' => (string) ($rows->get('status')?->value ?? 'unknown'),
                'suspend_reason' => (string) ($rows->get('suspend_reason')?->value ?? ''),
                'ends_at' => (string) ($rows->get('ends_at')?->value ?? ''),
                'checkout_url' => (string) ($rows->get('checkout_url')?->value ?? ''),
            ];
        });
    }
}
