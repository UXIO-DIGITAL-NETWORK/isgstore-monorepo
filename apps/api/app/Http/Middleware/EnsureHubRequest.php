<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gates the site's Hub reporting endpoints (/v1/hub/*): an API key issued by
 * the Hub, sent as X-Hub-Key, plus an optional source-IP allowlist — the same
 * two-factor shape as the uxiotopup callback gate.
 *
 * With no key configured the endpoints are dead, not open: a standalone
 * deployment that never registers with a Hub exposes nothing.
 */
class EnsureHubRequest
{
    public function handle(Request $request, Closure $next): Response
    {
        $configuredKey = (string) config('services.hub.api_key');

        if ($configuredKey === '' || ! hash_equals($configuredKey, (string) $request->header('X-Hub-Key'))) {
            return $this->forbidden();
        }

        // Optional allowlist; empty means the key alone gates. Requires
        // TrustProxies to be correct behind a LB or $request->ip() rejects
        // every pull — same caveat as the uxiotopup webhook.
        $allowedIps = array_filter(array_map('trim', explode(',', (string) config('services.hub.allowed_ips'))));

        if ($allowedIps !== [] && ! in_array($request->ip(), $allowedIps, true)) {
            Log::warning('Hub pull rejected: IP not allowed', ['ip' => $request->ip()]);

            return $this->forbidden();
        }

        return $next($request);
    }

    private function forbidden(): Response
    {
        return response()->json([
            'status' => 'error',
            'code' => 403,
            'message' => 'Forbidden.',
            'data' => null,
        ], 403);
    }
}
