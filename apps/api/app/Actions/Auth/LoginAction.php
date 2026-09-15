<?php

declare(strict_types=1);

namespace App\Actions\Auth;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Auth\LoginDTO;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\User;
use App\Support\DateTime\Wib;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class LoginAction
{
    public function __construct(
        private CreateActivityLogAction $activityLogAction,
        private IssueSessionAction $issueSession,
    ) {}

    /**
     * Execute the login action.
     *
     * @return array{access_token: string, refresh_token: string, user: User}
     *                                                                        |array{two_factor_required: true, challenge_token: string}
     *
     * @throws ValidationException
     */
    public function execute(LoginDTO $dto): array
    {
        if (! Auth::attempt(['email' => $dto->email, 'password' => $dto->password])) {
            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        /** @var User $user */
        $user = Auth::user();

        // The platform runs on one wall clock (WIB); a browser-supplied zone is
        // deliberately ignored. A stale value left by an older build is
        // corrected on the way in, so it can never disagree with the clock the
        // reports are bucketed in.
        if ($user->timezone !== Wib::TZ) {
            $user->update(['timezone' => Wib::TZ]);
        }

        // One door for every authentication path. When the account carries a
        // confirmed second factor this returns a challenge instead of tokens.
        $session = $this->issueSession->execute($user, request()->ip());

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: $user->id,
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: isset($session['two_factor_required'])
                ? 'Password accepted; awaiting two-factor code'
                : 'User logged in successfully'
        ));

        return $session;
    }
}
