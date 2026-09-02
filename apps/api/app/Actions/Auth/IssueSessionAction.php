<?php

declare(strict_types=1);

namespace App\Actions\Auth;

use App\Models\User;
use App\Support\Auth\TwoFactorChallengeToken;

/**
 * The one place a login turns into a session.
 *
 * Every authentication path — password, Google, registration — goes through
 * here. Three separate copies of "mint the token pair" used to exist, and
 * bolting a second-factor gate onto each of them would have meant the fourth
 * path added next year silently bypassing it. That is the single most likely
 * way this feature fails, so there is one door.
 *
 * When the account has a confirmed second factor, **no tokens are minted**: the
 * caller gets a challenge instead. The response deliberately carries nothing
 * else — no user, no email, no role. Returning the account would hand anyone
 * holding a leaked password list a free enumeration and role-disclosure oracle.
 */
class IssueSessionAction
{
    /** Matches the abilities every protected route group requires. */
    public const ACCESS_ABILITY = 'access-api';

    public const REFRESH_ABILITY = 'issue-access-token';

    /**
     * @return array{access_token: string, refresh_token: string, user: User}
     *                                                                        |array{two_factor_required: true, challenge_token: string}
     */
    public function execute(User $user, ?string $ip = null): array
    {
        if ($user->two_factor_confirmed_at !== null) {
            return [
                'two_factor_required' => true,
                'challenge_token' => TwoFactorChallengeToken::issue($user, $ip),
            ];
        }

        return $this->mint($user);
    }

    /**
     * Mint the pair unconditionally. Only for callers that have already
     * satisfied every factor — i.e. the verify endpoint and the refresh
     * exchange, whose refresh token could only have been minted here.
     *
     * @return array{access_token: string, refresh_token: string, user: User}
     */
    public function mint(User $user): array
    {
        return [
            'access_token' => $user->createToken('access_token', [self::ACCESS_ABILITY], now()->addMinutes(60))->plainTextToken,
            'refresh_token' => $user->createToken('refresh_token', [self::REFRESH_ABILITY], now()->addDays(30))->plainTextToken,
            // Role is eager-loaded so UserResource can emit it — the storefront
            // routes its member/admin guards off that value.
            'user' => $user->load('role'),
        ];
    }
}
