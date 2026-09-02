<?php

namespace App\Http\Middleware;

use App\Enums\RoleType;
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

        $isAdmin = strtolower((string) ($user?->role?->name ?? '')) === RoleType::ADMIN->value;

        if ($isAdmin && $user?->two_factor_confirmed_at === null) {
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
