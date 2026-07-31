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
    public function __construct(private readonly CreateActivityLogAction $activityLogAction) {}

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
                'timezone' => $dto->timezone ?? 'Asia/Jakarta',
            ]);
        });

        // Same token pair and lifetimes as LoginAction, so a new account is
        // signed in exactly like a returning one.
        $accessToken = $user->createToken('access_token', ['access-api'], now()->addMinutes(60))->plainTextToken;
        $refreshToken = $user->createToken('refresh_token', ['issue-access-token'], now()->addDays(30))->plainTextToken;

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: $user->id,
            ipAddress: request()?->ip(),
            userAgent: request()?->userAgent(),
            message: 'Account registered',
            type: ActivityType::VERIFICATION,
        ));

        return [
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken,
            'user' => $user->load('role'),
        ];
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
