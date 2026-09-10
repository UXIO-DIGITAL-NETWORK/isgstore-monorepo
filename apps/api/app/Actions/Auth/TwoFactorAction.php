<?php

declare(strict_types=1);

namespace App\Actions\Auth;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Enums\ActivityType;
use App\Models\User;
use App\Support\Auth\Base32;
use App\Support\Auth\Totp;
use App\Support\Auth\TwoFactorChallengeToken;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

/**
 * Enrolling, confirming, verifying and disabling a second factor.
 *
 * Two rules run through all of it:
 *
 *  - **Enrolment is only real once a code has been produced.** `setup` writes a
 *    secret but leaves `two_factor_confirmed_at` null, so a mistyped or
 *    half-scanned secret cannot lock anyone out at their next login.
 *  - **Any change to the second factor revokes every session.** Someone turning
 *    2FA on because they think they were compromised would otherwise leave the
 *    attacker's 30-day refresh token alive. A fresh pair is minted *afterwards*
 *    for the caller who just proved a code — that costs the rule nothing (every
 *    token an attacker held is already gone) and spares the admin a second
 *    login in the middle of an act they were told to complete.
 *
 * **Rotation** — moving the authenticator to another phone — is the third verb,
 * beside enrolling and disabling. It never lowers the account's protection for
 * a moment: the new secret waits in `two_factor_pending_secret` while the old
 * one stays in force, and only a code from the new device promotes it. See the
 * migration `2026_09_10_000001_add_two_factor_pending_secret`.
 */
class TwoFactorAction
{
    /**
     * How long an unconfirmed rotation stays claimable.
     *
     * Long enough to install an authenticator app from scratch, short enough
     * that a secret is not left lying in the database for weeks — which is
     * material for a silent enrolment if the session that created it leaked.
     */
    public const PENDING_TTL_MINUTES = 10;

    public function __construct(
        private readonly IssueSessionAction $issueSession,
        private readonly CreateActivityLogAction $activityLogAction,
    ) {}

    /**
     * Begin enrolment. Returns the secret and the URI an authenticator scans.
     *
     * @return array{secret: string, otpauth_uri: string}
     */
    public function setup(User $user): array
    {
        if ($user->two_factor_confirmed_at !== null) {
            // Rotating a live secret is a separate, password-protected act.
            // Without this an attacker holding a hijacked session could
            // silently re-enrol their own authenticator.
            throw new RuntimeException('Autentikasi dua faktor sudah aktif. Matikan dulu untuk mendaftarkan perangkat baru.');
        }

        $secret = Base32::randomSecret();

        $user->forceFill([
            'two_factor_secret' => $secret,
            'two_factor_pending_secret' => null,
            'two_factor_pending_created_at' => null,
            'two_factor_confirmed_at' => null,
            'two_factor_last_used_timestep' => null,
        ])->save();

        return [
            'secret' => $secret,
            'otpauth_uri' => Totp::provisioningUri(
                $secret,
                (string) $user->email,
                // The issuer is what the client sees in their authenticator
                // app forever after. It used to fall back to 'UXIOLABS' — the
                // one brand fallback in the codebase that was not the site's
                // own, and the one place it was most visible.
                (string) (config('services.storefront.brand') ?: 'ISG Store'),
            ),
        ];
    }

    /**
     * Prove the authenticator works, and only then switch 2FA on.
     *
     * @return array{access_token: string, refresh_token: string, user: User}
     */
    public function confirm(User $user, string $code): array
    {
        if ($user->two_factor_confirmed_at !== null) {
            throw new RuntimeException('Autentikasi dua faktor sudah aktif.');
        }

        $secret = (string) $user->two_factor_secret;

        if ($secret === '') {
            throw new RuntimeException('Mulai penyiapan terlebih dahulu.');
        }

        $step = Totp::verify($secret, $code, $user->two_factor_last_used_timestep);

        if ($step === null) {
            throw new RuntimeException('Kode tidak cocok. Periksa jam perangkatmu lalu coba lagi.');
        }

        $session = DB::transaction(function () use ($user, $step) {
            $user->forceFill([
                'two_factor_confirmed_at' => now(),
                'two_factor_last_used_timestep' => $step,
            ])->save();

            // Everything issued before the factor existed predates the
            // protection it is meant to add.
            $user->tokens()->delete();

            // Minted only after the sweep above, never before: the order is
            // what keeps "revokes every session" true while still handing the
            // caller a usable session back.
            return $this->issueSession->mint($user);
        });

        $this->log($user, 'Two-factor authentication enabled');

        return $session;
    }

    /**
     * Begin moving the authenticator to another device.
     *
     * Costs the current password **and** a code from the device being replaced.
     * The password alone would let a hijacked session re-enrol quietly; the code
     * alone would let anyone who once shouted a code over the phone do it.
     *
     * Nothing in force is touched — not the secret, not `two_factor_confirmed_at`,
     * not the caller's tokens. An abandoned rotation is a no-op.
     *
     * @return array{secret: string, otpauth_uri: string}
     */
    public function rotate(User $user, string $password, string $code): array
    {
        if ($user->two_factor_confirmed_at === null) {
            throw new RuntimeException('Belum ada authenticator yang bisa dipindahkan. Lakukan penyiapan terlebih dahulu.');
        }

        if (! Hash::check($password, (string) $user->password)) {
            throw new RuntimeException('Password tidak cocok.');
        }

        // `two_factor_last_used_timestep` is passed on purpose. Without it the
        // code the admin just spent logging in would be enough to move the
        // authenticator — which is exactly the phishing-proxy replay the column
        // exists to stop, aimed at the one action that hands over the account.
        $step = Totp::verify(
            (string) $user->two_factor_secret,
            $code,
            $user->two_factor_last_used_timestep,
        );

        if ($step === null) {
            throw new RuntimeException('Kode tidak cocok. Periksa jam perangkatmu lalu coba lagi.');
        }

        $pending = Base32::randomSecret();

        $user->forceFill([
            'two_factor_pending_secret' => $pending,
            'two_factor_pending_created_at' => now(),
            'two_factor_last_used_timestep' => $step,
        ])->save();

        $this->log($user, 'Two-factor rotation started');

        return [
            'secret' => $pending,
            'otpauth_uri' => Totp::provisioningUri(
                $pending,
                (string) $user->email,
                (string) (config('services.storefront.brand') ?: 'ISG Store'),
            ),
        ];
    }

    /**
     * Finish the move: a code from the NEW device promotes it to the live one.
     *
     * @return array{access_token: string, refresh_token: string, user: User}
     */
    public function confirmRotation(User $user, string $code): array
    {
        $pending = (string) $user->two_factor_pending_secret;

        if ($pending === '') {
            throw new RuntimeException('Tidak ada pemindahan yang sedang berjalan. Mulai dari awal.');
        }

        if ($user->two_factor_pending_created_at?->lt(now()->subMinutes(self::PENDING_TTL_MINUTES)) ?? true) {
            // Cleared rather than left to linger, so the next attempt starts
            // from a clean slate instead of failing against a dead secret.
            $this->clearPending($user);

            throw new RuntimeException('Pemindahan sudah kedaluwarsa. Mulai dari awal.');
        }

        // `null`, not the stored timestep: that step was spent against the OLD
        // secret, and steps are wall-clock, so passing it would reject a
        // perfectly good code from the new device for landing in the same
        // thirty seconds. The new secret has never authenticated anything
        // anywhere, and every token dies a line later, so there is nothing to
        // replay.
        $step = Totp::verify($pending, $code, null);

        if ($step === null) {
            throw new RuntimeException('Kode tidak cocok. Pastikan kamu memakai kode dari perangkat yang baru.');
        }

        $session = DB::transaction(function () use ($user, $pending, $step) {
            $user->forceFill([
                'two_factor_secret' => $pending,
                'two_factor_pending_secret' => null,
                'two_factor_pending_created_at' => null,
                'two_factor_last_used_timestep' => $step,
                // Deliberately NOT touched. A rotation changes which device
                // holds the factor, not the fact that the account has had one
                // since a given date.
            ])->save();

            $user->tokens()->delete();

            return $this->issueSession->mint($user);
        });

        $this->log($user, 'Two-factor authenticator rotated');

        return $session;
    }

    /**
     * Exchange a challenge plus a code for a real session.
     *
     * @return array{access_token: string, refresh_token: string, user: User}
     */
    public function verify(string $challengeToken, string $code, ?string $ip = null): array
    {
        $challenge = TwoFactorChallengeToken::resolve($challengeToken, $ip);

        if (! $challenge) {
            // Unknown, expired, spent, or from another address — one answer.
            throw new RuntimeException('Sesi login sudah tidak berlaku. Silakan login ulang.');
        }

        /** @var User $user */
        $user = $challenge->user;

        // Deliberately NOT wrapped in a transaction. The attempt counter has
        // to survive a wrong code, and throwing out of a transaction rolls the
        // increment back with everything else — which would leave the challenge
        // brute-forceable for its whole five-minute life.
        $step = Totp::verify(
            (string) $user->two_factor_secret,
            $code,
            $user->two_factor_last_used_timestep,
        );

        if ($step === null) {
            $challenge->increment('attempts');

            // The primary brute-force control. It cannot be spread across IPs:
            // a fresh challenge costs a correct password.
            if ($challenge->attempts >= TwoFactorChallengeToken::MAX_ATTEMPTS) {
                $challenge->delete();
                $this->log($user, 'Two-factor challenge abandoned after too many wrong codes');

                throw new RuntimeException('Terlalu banyak kode salah. Silakan login ulang.');
            }

            $this->log($user, 'Two-factor code rejected');

            throw new RuntimeException('Kode tidak cocok.');
        }

        // The success path is atomic: consuming the challenge and recording the
        // spent timestep must land together, or a crash between them would let
        // the same code be replayed on a new challenge.
        return DB::transaction(function () use ($challenge, $user, $step) {
            $locked = $challenge->newQuery()->whereKey($challenge->getKey())->lockForUpdate()->first();

            if (! $locked || $locked->consumed_at !== null) {
                throw new RuntimeException('Sesi login sudah tidak berlaku. Silakan login ulang.');
            }

            $locked->forceFill(['consumed_at' => now()])->save();

            // Recorded so the same code cannot be replayed inside the ±1 drift
            // window — the realistic attack is a proxy relaying what the victim
            // just typed, not brute force.
            $user->forceFill(['two_factor_last_used_timestep' => $step])->save();

            return $this->issueSession->mint($user);
        });
    }

    /** Turn the second factor off. Requires the current password. */
    public function disable(User $user, string $password): void
    {
        if (! Hash::check($password, (string) $user->password)) {
            throw new RuntimeException('Password tidak cocok.');
        }

        DB::transaction(function () use ($user) {
            $user->forceFill([
                'two_factor_secret' => null,
                // An unfinished rotation goes with it, or the leftover secret
                // would attach itself to whatever enrolment happens next.
                'two_factor_pending_secret' => null,
                'two_factor_pending_created_at' => null,
                'two_factor_confirmed_at' => null,
                'two_factor_last_used_timestep' => null,
            ])->save();

            $user->tokens()->delete();
        });

        $this->log($user, 'Two-factor authentication disabled');
    }

    private function clearPending(User $user): void
    {
        $user->forceFill([
            'two_factor_pending_secret' => null,
            'two_factor_pending_created_at' => null,
        ])->save();
    }

    private function log(User $user, string $message): void
    {
        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: $user->id,
            ipAddress: request()?->ip(),
            userAgent: request()?->userAgent(),
            message: $message,
            type: ActivityType::SECURITY,
        ));
    }
}
