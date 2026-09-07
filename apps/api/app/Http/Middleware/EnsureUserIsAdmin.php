<?php

namespace App\Http\Middleware;

use App\Enums\RoleType;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdmin
{
    /**
     * Restrict access to the Admin role. Matched by role name rather than a
     * hardcoded id — role_id is only 1 for Admin because RoleSeeder happens to
     * insert it first (database/seeders/RoleSeeder.php); that ordering isn't
     * guaranteed in every environment (e.g. tests that create roles ad hoc).
     */
    public function handle(Request $request, Closure $next): Response
    {
        $roleName = $request->user()?->role?->name;

        if (! $roleName || strtolower($roleName) !== RoleType::ADMIN->value) {
            return response()->json([
                'status' => 'error',
                'code' => 403,
                'message' => 'Forbidden. Admin access required.',
                'data' => null,
            ], 403);
        }

        return $next($request);
    }
}
