<?php

namespace App\Http\Middleware;

use App\Support\Auth\TwoFactorPolicy;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * An admin must carry a second factor.
 *
 * Optional everywhere else — this gate only fires for the `admin` role, whose
 * panel can move money, change prices and read every customer's contact
 * details. Optional 2FA generally means nobody has it.
 *
 * WHO owes a factor is `TwoFactorPolicy`'s answer, not this class's. The login
 * door (`IssueSessionAction`) and the client's navigation signal
 * (`UserResource`) ask the same question, and that policy also carries the
 * per-account exemption (`users.two_factor_exempt`) — the deliberate hole for
 * the developer login.
 *
 * The 403 carries a machine-readable `code` so the client can route to setup
 * instead of surfacing a generic error toast: the panel fires several requests
 * per page and the admin would otherwise see whichever one lost the race.
 *
 * The setup routes deliberately live outside the group this guards — an admin
 * mid-enrolment needs a session to reach them.
 */
class EnsureTwoFactorSatisfied
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user !== null && TwoFactorPolicy::requiredFor($user) && $user->two_factor_confirmed_at === null) {
            return response()->json([
                'status' => 'error',
                'code' => 403,
                'message' => 'Aktifkan autentikasi dua faktor untuk melanjutkan.',
                'data' => ['code' => 'two_factor_setup_required'],
            ], 403);
        }

        return $next($request);
    }
}
