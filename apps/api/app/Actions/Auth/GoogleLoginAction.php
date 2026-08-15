<?php

declare(strict_types=1);

namespace App\Actions\Auth;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Auth\GoogleLoginDTO;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Enums\ActivityType;
use App\Enums\RoleType;
use App\Models\Role;
use App\Models\User;
use App\Services\GoogleTokenVerifier;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Sign in (or transparently register) a user from a Google ID token.
 *
 * A first-time Google user is created as a MEMBER — the same rule RegisterAction
 * enforces — with no password and no phone. A returning user is matched by
 * google_id first, then by verified email so an existing password account gets
 * its Google identity linked instead of a duplicate row.
 */
class GoogleLoginAction
{
    public function __construct(
        private readonly GoogleTokenVerifier $verifier,
        private readonly CreateActivityLogAction $activityLogAction,
    ) {}

    /**
     * @return array{access_token: string, refresh_token: string, user: User}
     *
     * @throws ValidationException
     */
    public function execute(GoogleLoginDTO $dto): array
    {
        $payload = $this->verifier->verify($dto->credential);

        if ($payload === null) {
            throw ValidationException::withMessages([
                'credential' => 'Google sign-in gagal. Silakan coba lagi.',
            ]);
        }

        // Google only omits email_verified when the address is unverified; treat
        // anything but an explicit true as unverified so we never trust it.
        if (($payload['email_verified'] ?? false) !== true || empty($payload['email'])) {
            throw ValidationException::withMessages([
                'credential' => 'Akun Google Anda belum memiliki email terverifikasi.',
            ]);
        }

        $googleId = (string) $payload['sub'];
        $email = (string) $payload['email'];
        $name = (string) ($payload['name'] ?? $email);
        $picture = $payload['picture'] ?? null;

        $user = DB::transaction(function () use ($googleId, $email, $name, $picture, $dto) {
            $user = User::where('google_id', $googleId)->first()
                ?? User::where('email', $email)->first();

            if ($user === null) {
                return User::create([
                    'role_id' => $this->memberRoleId(),
                    'name' => $name,
                    'email' => $email,
                    'google_id' => $googleId,
                    'avatar' => $picture,
                    'locale' => config('app.locale'),
                    'timezone' => $dto->timezone ?? 'Asia/Jakarta',
                ]);
            }

            // Existing password account signing in with Google for the first
            // time — link the identity so future logins match by google_id.
            if ($user->google_id === null) {
                $user->google_id = $googleId;
            }

            // Piggyback timezone sync, mirroring LoginAction.
            if ($dto->timezone !== null && $user->timezone !== $dto->timezone) {
                $user->timezone = $dto->timezone;
            }

            if ($user->isDirty()) {
                $user->save();
            }

            return $user;
        });

        // Same token pair and lifetimes as LoginAction/RegisterAction so a
        // Google sign-in is indistinguishable from a normal one downstream.
        $accessToken = $user->createToken('access_token', ['access-api'], now()->addMinutes(60))->plainTextToken;
        $refreshToken = $user->createToken('refresh_token', ['issue-access-token'], now()->addDays(30))->plainTextToken;

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: $user->id,
            ipAddress: request()?->ip(),
            userAgent: request()?->userAgent(),
            message: 'User logged in with Google',
            type: ActivityType::LOGIN,
        ));

        return [
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken,
            'user' => $user->load('role'),
        ];
    }

    /**
     * Roles are seeded, not created on demand — same guard as RegisterAction.
     */
    private function memberRoleId(): int
    {
        $role = Role::whereRaw('LOWER(name) = ?', [RoleType::MEMBER->value])->first();

        if (! $role) {
            throw ValidationException::withMessages([
                'credential' => 'Pendaftaran belum tersedia. Silakan hubungi admin.',
            ]);
        }

        return $role->id;
    }
}
