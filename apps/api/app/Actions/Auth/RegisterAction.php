<?php

declare(strict_types=1);

namespace App\Actions\Auth;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Auth\RegisterDTO;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Enums\ActivityType;
use App\Enums\RoleType;
use App\Models\Role;
use App\Models\User;
use App\Support\DateTime\Wib;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Self-service signup.
 *
 * Always creates a MEMBER — the tier ladder (vip/reseller/agent) is an admin
 * decision, and role must never be settable from a public request body.
 */
class RegisterAction
{
    public function __construct(
        private readonly CreateActivityLogAction $activityLogAction,
        private readonly IssueSessionAction $issueSession,
    ) {}

    /**
     * @return array{access_token: string, refresh_token: string, user: User}
     */
    public function execute(RegisterDTO $dto): array
    {
        $user = DB::transaction(function () use ($dto) {
            return User::create([
                'role_id' => $this->memberRoleId(),
                'name' => $dto->name,
                'username' => $dto->username,
                'email' => $dto->email,
                'phone' => $dto->phone,
                'password' => $dto->password,   // hashed by the model cast
                'locale' => $dto->locale ?? config('app.locale'),
                'timezone' => Wib::TZ,
            ]);
        });

        // Through the shared issuer, like every other path. A brand-new
        // account has no second factor, so this always returns tokens — but it
        // must not be the one route that mints them by hand.
        $session = $this->issueSession->mint($user);

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: $user->id,
            ipAddress: request()?->ip(),
            userAgent: request()?->userAgent(),
            message: 'Account registered',
            type: ActivityType::VERIFICATION,
        ));

        return $session;
    }

    /**
     * Roles are seeded, not created on demand: an unseeded database is a
     * deployment fault, and silently inventing a role would give the new
     * account undefined permissions.
     */
    private function memberRoleId(): int
    {
        $role = Role::whereRaw('LOWER(name) = ?', [RoleType::MEMBER->value])->first();

        if (! $role) {
            throw ValidationException::withMessages([
                'email' => 'Pendaftaran belum tersedia. Silakan hubungi admin.',
            ]);
        }

        return $role->id;
    }
}
