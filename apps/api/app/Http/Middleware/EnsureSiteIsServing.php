<?php

namespace App\Http\Middleware;

use App\Support\SiteLicenceState;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * The kill switch: when the Hub has suspended this site or its licence has
 * lapsed, the public side stops answering.
 *
 * This is the first middleware this app appends globally, and that is the
 * point. The alternative — attaching it to each public route group — fails in
 * the direction that matters most: a public route added later would silently
 * escape the gate, and a kill switch with a hole in it is not a lever. Gating
 * globally and listing the exceptions means a NEW route is closed by default,
 * and `SiteAvailabilityRoutesTest` walks the whole route table so a route on
 * the wrong side of the list fails a test instead of surprising a client.
 *
 * What stays open, and why each one is load-bearing:
 *
 *  - `v1/hub/*` — the Hub must always be able to reach in. Close this and
 *    switching the site back on becomes impossible from the panel that switched
 *    it off.
 *  - `v1/auth/*` — the client's admin has to be able to log in to see what
 *    happened and pay for it. Locking them out would make a billing lever a
 *    hostage situation.
 *  - the admin / payment-admin / payment-internal groups — same reason, and the
 *    explicit decision: publik mati, admin tetap masuk.
 *  - gateway webhooks — a payment already in flight must still settle. This is
 *    also the path a renewal arrives on, so closing it would make a suspended
 *    site impossible to un-suspend by paying.
 *  - `v1/storefront/settings` — the public settings read, so the down-page can
 *    render the client's own name and logo instead of a raw error.
 *  - health/ping — monitoring should report the site is up but closed, not go
 *    dark with it.
 *
 * Everything else — the storefront catalog, checkout, invoice lookups, member
 * self-service — gets a 503.
 */
class EnsureSiteIsServing
{
    /**
     * Path patterns (relative to the API prefix) that answer even when closed.
     *
     * @var list<string>
     */
    private const ALWAYS_OPEN = [
        'up',
        'api/v1/ping',
        'api/v1/health',
        // The control plane. Never gate these.
        'api/v1/hub/*',
        // Login/refresh/logout for every panel.
        'api/v1/auth/*',
        // Money already in motion, and the renewal path. Signature-verified
        // inside each controller, so opening them costs nothing.
        // Named one by one rather than as `monetapay/*`: that prefix also holds
        // three dozen admin-only gateway tools, and a wildcard would quietly
        // exempt every one of them.
        'api/v1/payment/callback',
        'api/v1/monetapay/va/callback',
        'api/v1/monetapay/ewallet/callback',
        'api/v1/monetapay/qris/callback',
        'api/v1/monetapay/subscription/callback/*',
        'api/v1/uxiolabs/callback',
        'api/v1/uxiotopup/callback',
        'api/v1/disbursement/merchant/callback',
        // Branding for the down-page itself.
        'api/v1/storefront/settings',
        // The panels: kita's staff and the client's own admins.
        'api/v1/payment-admin/*',
        'api/v1/payment-internal/*',
        'api/broadcasting/*',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        if (! SiteLicenceState::isManaged() || SiteLicenceState::isServing()) {
            return $next($request);
        }

        if ($this->isAlwaysOpen($request)) {
            return $next($request);
        }

        // The admin group is matched by its middleware rather than its path:
        // it shares the bare `v1` prefix with the public storefront routes, so
        // there is no prefix that separates them. `admin` on the route is the
        // honest discriminator.
        if ($this->isPanelRoute($request)) {
            return $next($request);
        }

        $closure = SiteLicenceState::closure();

        return response()->json([
            'status' => 'error',
            'code' => 503,
            'message' => $closure['status'] === 'suspended'
                ? 'Situs sedang dinonaktifkan. Hubungi pengelola untuk mengaktifkan kembali.'
                : 'Masa aktif situs telah berakhir. Perpanjang untuk mengaktifkan kembali.',
            'data' => ['licence' => $closure],
        ], 503)->header('Retry-After', '900');
    }

    private function isAlwaysOpen(Request $request): bool
    {
        return $request->is(...self::ALWAYS_OPEN);
    }

    private function isPanelRoute(Request $request): bool
    {
        $middleware = $request->route()?->gatherMiddleware() ?? [];

        foreach (['admin', 'payment-admin', 'payment-internal'] as $gate) {
            if (in_array($gate, $middleware, true)) {
                return true;
            }
        }

        return false;
    }
}
