<?php

namespace App\Http\Controllers\Api\Auth;

use App\Actions\Auth\TwoFactorAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ConfirmTwoFactorRotationRequest;
use App\Http\Requests\Auth\RotateTwoFactorRequest;
use App\Http\Resources\User\UserResource;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use RuntimeException;

/**
 * The second-factor surface.
 *
 * `verify` is unauthenticated by design: the caller has proved a password but
 * holds no session yet, and the challenge token is the only thing that gets
 * them further. Every other action here needs a live session.
 */
class TwoFactorController extends Controller
{
    use ApiResponse;

    public function setup(Request $request, TwoFactorAction $action)
    {
        try {
            $result = $action->setup($request->user());
        } catch (RuntimeException $e) {
            return $this->errorResponse($e->getMessage(), 409);
        }

        return $this->successResponse($result, 'Scan the QR code, then confirm with a code');
    }

    public function confirm(Request $request, TwoFactorAction $action)
    {
        $validated = $request->validate(['code' => ['required', 'string']]);

        try {
            $session = $action->confirm($request->user(), $validated['code']);
        } catch (RuntimeException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }

        // Enabling revokes every session — every token an attacker might hold
        // is gone. The pair returned here is minted after that sweep, so the
        // admin who just proved a code carries straight on into the panel
        // instead of signing in a second time.
        return $this->successResponse(
            $this->session($session),
            'Autentikasi dua faktor aktif.'
        );
    }

    /**
     * Start moving the authenticator to another device.
     *
     * Answers with a new secret to scan while the old one is still the one in
     * force — nothing is switched over until `confirmRotation` accepts a code
     * from the new device.
     */
    public function rotate(RotateTwoFactorRequest $request, TwoFactorAction $action)
    {
        try {
            $result = $action->rotate(
                $request->user(),
                (string) $request->validated('password'),
                (string) $request->validated('code'),
            );
        } catch (RuntimeException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }

        return $this->successResponse($result, 'Scan kode QR baru, lalu konfirmasi dengan kodenya');
    }

    public function confirmRotation(ConfirmTwoFactorRotationRequest $request, TwoFactorAction $action)
    {
        try {
            $session = $action->confirmRotation($request->user(), (string) $request->validated('code'));
        } catch (RuntimeException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }

        return $this->successResponse(
            $this->session($session),
            'Authenticator berhasil dipindahkan.'
        );
    }

    public function verify(Request $request, TwoFactorAction $action)
    {
        $validated = $request->validate([
            'challenge_token' => ['required', 'string'],
            'code' => ['required', 'string'],
        ]);

        try {
            $session = $action->verify($validated['challenge_token'], $validated['code'], $request->ip());
        } catch (RuntimeException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }

        return $this->successResponse($this->session($session), 'Login successful');
    }

    public function disable(Request $request, TwoFactorAction $action)
    {
        $validated = $request->validate(['password' => ['required', 'string']]);

        try {
            $action->disable($request->user(), $validated['password']);
        } catch (RuntimeException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }

        return $this->successResponse(null, 'Autentikasi dua faktor dimatikan.');
    }

    /**
     * The one session shape. Three endpoints here hand back a token pair, and
     * the admin panel narrows on these exact keys.
     *
     * @param  array{access_token: string, refresh_token: string, user: User}  $session
     */
    private function session(array $session): array
    {
        return [
            'user' => new UserResource($session['user']),
            'access_token' => $session['access_token'],
            'refresh_token' => $session['refresh_token'],
        ];
    }
}
