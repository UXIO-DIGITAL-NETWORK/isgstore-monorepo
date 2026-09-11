<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Support\Locale\SupportedLocale;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Decides which language this request is answered in.
 *
 * Appended to the `api` group, so it is one answer for every endpoint rather
 * than a per-controller decision — the previous state of affairs, where the
 * language of a message depended on which author wrote it, is exactly what
 * having no such middleware produces.
 *
 * Resolution order, most deliberate first:
 *
 *  1. **`users.locale`** — the only signal a person actually chose. It lives on
 *     the account rather than in a cookie so it follows them to a new device,
 *     which is the whole reason the panels store it server-side.
 *  2. **`Accept-Language`** — for guests. The storefront's public endpoints
 *     serve buyers with no account, and asking someone to pick a language
 *     before they can see a price is worse than reading what their browser
 *     already sends.
 *  3. **`config('app.locale')`** — Indonesian.
 *
 * An unsupported value at any rung is skipped, never an error: a browser set to
 * Japanese is not a bad request, and a `users.locale` written before the column
 * was constrained should degrade rather than break the account.
 */
class SetLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        // `user('sanctum')` rather than `user()`: this runs on the whole api
        // group, including routes with no auth middleware, where the default
        // guard is `web` and cannot see a bearer token.
        $preferred = SupportedLocale::normalise($request->user('sanctum')?->locale)
            ?? $this->fromHeader($request)
            ?? SupportedLocale::fallback();

        app()->setLocale($preferred);

        return $next($request);
    }

    /**
     * The first language in `Accept-Language` this platform can serve.
     *
     * Deliberately in the browser's own order of preference — someone whose
     * header reads `ja, en;q=0.8, id;q=0.5` gets English, not Indonesian.
     */
    private function fromHeader(Request $request): ?string
    {
        foreach ($request->getLanguages() as $language) {
            $match = SupportedLocale::normalise($language);

            if ($match !== null) {
                return $match;
            }
        }

        return null;
    }
}
