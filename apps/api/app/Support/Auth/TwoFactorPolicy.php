<?php

declare(strict_types=1);

namespace App\Support\Auth;

use App\Enums\RoleType;
use App\Models\User;

/**
 * Who owes a second factor before the panel opens.
 *
 * The answer is read in three places that must never disagree: the API gate
 * (`EnsureTwoFactorSatisfied`), the navigation signal the client routes on
 * (`UserResource.two_factor_required`), and the login door (`IssueSessionAction`).
 * It used to be three copies of "the role name is admin", and a copy that missed
 * the exemption would either bounce the developer account to the setup screen
 * after it had already been let in, or hand a normal admin a password-only
 * session. One question, one answer.
 */
final class TwoFactorPolicy
{
    /** Does this account owe a factor before it can use the panel? */
    public static function requiredFor(?User $user): bool
    {
        if ($user === null || self::isExempt($user)) {
            return false;
        }

        return strtolower((string) ($user->role?->name ?? '')) === RoleType::ADMIN->value;
    }

    /**
     * A deliberate hole in the panel's second factor, granted one account at a
     * time (`users.two_factor_exempt`). Such an account is only as safe as its
     * password — never widen this without treating it as a shared secret.
     */
    public static function isExempt(User $user): bool
    {
        return (bool) $user->two_factor_exempt;
    }
}
