<?php

namespace App\Http\Middleware;

use App\Enums\RoleType;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Restrict access to the Finance role — "kita" (the platform/internal
 * operator) on the payment page. Matched by role name, mirroring
 * EnsureUserIsAdmin, so it stays independent of role_id ordering.
 */
class EnsureUserIsFinance
{
    public function handle(Request $request, Closure $next): Response
    {
        $roleName = $request->user()?->role?->name;

        if (! $roleName || strtolower($roleName) !== RoleType::FINANCE->value) {
            return response()->json([
                'status' => 'error',
                'code' => 403,
                'message' => 'Forbidden. Finance access required.',
                'data' => null,
            ], 403);
        }

        return $next($request);
    }
}
