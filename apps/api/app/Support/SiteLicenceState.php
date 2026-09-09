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
     * **A site with no answer yet serves.** A fresh deployment, a site whose
     * first sync has not run, a site whose Hub is unreachable — all of them keep
     * working. Only an explicit "not serving" from the Hub closes the door, and
     * that answer then persists until the Hub says otherwise.
     *
     * Note what this deliberately does NOT do: expire the suspension after some
     * period of silence. An amnesty would teach a delinquent client that
     * blocking the Hub brings their site back, and it is not needed to protect
     * against a Hub outage — a serving site stays serving when the Hub dies,
     * because nothing changes its answer.
     */
    public static function isServing(): bool
    {
        return self::read()['is_serving'];
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

    /** @return array{is_serving: bool, status: string, suspend_reason: string, ends_at: string, checkout_url: string} */
    private static function read(): array
    {
        return Cache::remember(self::CACHE_KEY, self::CACHE_TTL, function (): array {
            $rows = Setting::where('group', self::GROUP)->get()->keyBy('key');

            return [
                // Absent means "never synced" — which serves. See isServing().
                'is_serving' => $rows->has('is_serving')
                    ? (bool) $rows->get('is_serving')->typedValue()
                    : true,
                'status' => (string) ($rows->get('status')?->value ?? 'unknown'),
                'suspend_reason' => (string) ($rows->get('suspend_reason')?->value ?? ''),
                'ends_at' => (string) ($rows->get('ends_at')?->value ?? ''),
                'checkout_url' => (string) ($rows->get('checkout_url')?->value ?? ''),
            ];
        });
    }
}
