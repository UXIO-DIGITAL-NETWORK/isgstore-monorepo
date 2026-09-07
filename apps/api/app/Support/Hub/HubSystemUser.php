<?php

declare(strict_types=1);

namespace App\Support\Hub;

use App\Enums\RoleType;
use App\Models\Role;
use App\Models\User;

/**
 * The system account that money-path actions driven FROM the Hub are attributed
 * to on this site. Hub requests carry no authenticated user (they authenticate
 * with a key), but ApproveWithdrawalAction et al. require a User $approver — so
 * every Hub-driven approve/reject records THIS user in approved_by/verified_by.
 * The real human who clicked is recorded on the Hub's own site_action_logs.
 *
 * Idempotent: resolve() is a firstOrCreate, so it works whether or not the
 * seeder ran (tests hit it directly).
 */
class HubSystemUser
{
    /** Stable identity — never a login account (no password), matched by email. */
    public const EMAIL = 'hub-system@uxio.internal';

    public static function resolve(): User
    {
        $role = Role::firstOrCreate(['name' => 'Payment-Internal']);

        return User::firstOrCreate(
            ['email' => self::EMAIL],
            [
                'name' => 'Uxio Hub (sistem)',
                'role_id' => $role->id,
                'password' => null,
            ],
        );
    }

    /** @return non-empty-string */
    public static function roleValue(): string
    {
        return RoleType::PAYMENT_INTERNAL->value;
    }
}
