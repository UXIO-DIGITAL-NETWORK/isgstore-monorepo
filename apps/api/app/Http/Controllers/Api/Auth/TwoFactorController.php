<?php

namespace App\Http\Controllers\Api\Auth;

use App\Actions\Auth\TwoFactorAction;
use App\Http\Controllers\Controller;
use App\Http\Resources\User\UserResource;
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
            $action->confirm($request->user(), $validated['code']);
        } catch (RuntimeException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }

        // Enabling revokes every session, this one included — the client has to
        // sign in again, which is the point.
        return $this->successResponse(null, 'Autentikasi dua faktor aktif. Silakan login ulang.');
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

        return $this->successResponse([
            'user' => new UserResource($session['user']),
            'access_token' => $session['access_token'],
            'refresh_token' => $session['refresh_token'],
        ], 'Login successful');
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
}
