<?php

namespace App\Http\Middleware;

use App\Enums\RoleType;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Restrict access to the Payment-Internal role — "kita" (the internal team that
 * verifies withdrawals and sets fees). Matched by role name, mirroring
 * EnsureUserIsAdmin, so it stays independent of role_id ordering.
 */
class EnsureUserIsPaymentInternal
{
    public function handle(Request $request, Closure $next): Response
    {
        $roleName = $request->user()?->role?->name;

        if (! $roleName || strtolower($roleName) !== RoleType::PAYMENT_INTERNAL->value) {
            return response()->json([
                'status' => 'error',
                'code' => 403,
                'message' => 'Forbidden. Payment-internal access required.',
                'data' => null,
            ], 403);
        }

        return $next($request);
    }
}
