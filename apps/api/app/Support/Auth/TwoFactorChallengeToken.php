<?php

declare(strict_types=1);

namespace App\Support\Auth;

use App\Models\TwoFactorChallenge;
use App\Models\User;
use Illuminate\Support\Str;

/**
 * The credential that carries a half-finished login.
 *
 * A direct twin of `App\Support\Refund\RefundClaimToken`: the plaintext travels
 * once, in the login response, and only its sha256 is stored — so a database
 * read cannot finish anybody's login. Unknown and expired are the same answer,
 * for the same reason as there.
 *
 * Five wrong codes destroy the challenge. That, not the rate limiter, is the
 * brute-force control: it cannot be spread across IPs, because every new
 * challenge costs a correct password.
 */
final class TwoFactorChallengeToken
{
    private const LENGTH = 48;

    /** Long enough to fetch a phone, short enough that a leak goes stale. */
    public const TTL_MINUTES = 5;

    public const MAX_ATTEMPTS = 5;

    /** @return string The plaintext token. */
    public static function issue(User $user, ?string $ip = null): string
    {
        // One live challenge per account: starting a new login invalidates the
        // half-finished one, so a stolen token cannot be held in reserve.
        TwoFactorChallenge::where('user_id', $user->id)->delete();

        $plain = Str::random(self::LENGTH);

        TwoFactorChallenge::create([
            'user_id' => $user->id,
            'token_hash' => self::hash($plain),
            'expires_at' => now()->addMinutes(self::TTL_MINUTES),
            'ip_address' => $ip,
        ]);

        return $plain;
    }

    public static function hash(string $plain): string
    {
        return hash('sha256', $plain);
    }

    /**
     * Resolve a plaintext token, or null when it is unknown, expired, spent, or
     * being finished from a different address. Callers must treat every one of
     * those identically — telling them apart confirms a token once existed.
     */
    public static function resolve(string $plain, ?string $ip = null): ?TwoFactorChallenge
    {
        if (trim($plain) === '') {
            return null;
        }

        $challenge = TwoFactorChallenge::with('user')
            ->where('token_hash', self::hash($plain))
            ->first();

        if (! $challenge || $challenge->consumed_at !== null || $challenge->expires_at->isPast()) {
            return null;
        }

        // Login and verification are seconds apart; a different address means
        // somebody else is finishing the login.
        if ($ip !== null && $challenge->ip_address !== null && $challenge->ip_address !== $ip) {
            return null;
        }

        return $challenge;
    }
}
