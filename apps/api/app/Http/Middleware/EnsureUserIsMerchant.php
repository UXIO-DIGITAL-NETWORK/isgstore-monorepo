<?php

namespace App\Http\Middleware;

use App\Enums\RoleType;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Restrict access to the Finance-Developer role — the "client" (merchant) on
 * the payment page. Route handlers still scope every query to the caller's own
 * id; this gate only keeps non-merchants out of the merchant surface.
 */
class EnsureUserIsMerchant
{
    public function handle(Request $request, Closure $next): Response
    {
        $roleName = $request->user()?->role?->name;

        if (! $roleName || strtolower($roleName) !== RoleType::FINANCE_DEVELOPER->value) {
            return response()->json([
                'status' => 'error',
                'code' => 403,
                'message' => 'Forbidden. Merchant access required.',
                'data' => null,
            ], 403);
        }

        return $next($request);
    }
}
