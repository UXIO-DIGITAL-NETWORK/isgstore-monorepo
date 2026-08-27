<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gates the site's Hub money-path WRITE endpoints (approve/reject withdrawals,
 * confirm/reject service invoices). Stacked ON TOP of `hub` (read gate), it
 * adds a SECOND, separate factor: a write-scoped key sent as X-Hub-Write-Key.
 *
 * Why a distinct key from the read key: the read key is long-lived and widely
 * distributed (every reporting pull carries it); it must never be sufficient to
 * move money. Writes also require `HUB_WRITE_ENABLED` — a site can accept the
 * Hub's reports while refusing Hub-driven money movement. No write key or the
 * flag off ⇒ these endpoints are dead.
 */
class EnsureHubWriteRequest
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! config('services.hub.write_enabled')) {
            return $this->forbidden('Hub write channel is disabled on this site.');
        }

        $configuredKey = (string) config('services.hub.write_api_key');

        if ($configuredKey === '' || ! hash_equals($configuredKey, (string) $request->header('X-Hub-Write-Key'))) {
            Log::warning('Hub write rejected: bad or missing write key', ['ip' => $request->ip()]);

            return $this->forbidden('Invalid Hub write key.');
        }

        return $next($request);
    }

    private function forbidden(string $message): Response
    {
        return response()->json([
            'status' => 'error',
            'code' => 403,
            'message' => $message,
            'data' => null,
        ], 403);
    }
}
