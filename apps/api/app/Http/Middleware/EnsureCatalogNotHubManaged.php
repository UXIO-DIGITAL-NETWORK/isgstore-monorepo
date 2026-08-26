<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Blocks the site-local service-catalog write endpoints once the catalog is
 * managed by the Hub. If both the Hub and the local panel could edit, the next
 * hub:sync-catalog run would silently overwrite the local change — a "bug"
 * nobody can reproduce. Read endpoints stay; the panel becomes a viewer.
 */
class EnsureCatalogNotHubManaged
{
    public function handle(Request $request, Closure $next): Response
    {
        if (config('services.hub.enabled') && config('services.hub.managed_catalog')) {
            return response()->json([
                'status' => 'error',
                'code' => 422,
                'message' => 'Katalog service dikelola di Hub. Ubah dari panel Hub — perubahan lokal akan tertimpa sinkronisasi.',
                'data' => null,
            ], 422);
        }

        return $next($request);
    }
}
