<?php

use App\Http\Middleware\EnsureCatalogNotHubManaged;
use App\Http\Middleware\EnsureHubRequest;
use App\Http\Middleware\EnsureHubWriteRequest;
use App\Http\Middleware\EnsureSiteIsServing;
use App\Http\Middleware\EnsureTwoFactorSatisfied;
use App\Http\Middleware\EnsureUserIsAdmin;
use App\Http\Middleware\EnsureUserIsPaymentAdmin;
use App\Http\Middleware\EnsureUserIsPaymentInternal;
use App\Http\Middleware\SetLocale;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\Http\Middleware\CheckAbilities;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    // Broadcasting auth is placed under the API prefix and behind Sanctum: both
    // SPAs authenticate with bearer tokens, not the session cookie the default
    // `/broadcasting/auth` (web guard) route expects. This also loads
    // routes/channels.php, registering the private-channel authorization
    // callbacks (admin.transactions, member.{userId}.transactions).
    ->withBroadcasting(
        __DIR__.'/../routes/channels.php',
        attributes: ['prefix' => 'api', 'middleware' => ['auth:sanctum']],
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Trusted proxies are wired in AppServiceProvider::boot() instead: this
        // callback runs before the config repository is bound, so reading
        // config() here throws. See config/app.php for what the value means.
        $middleware->throttleApi();
        // The one globally appended middleware in this app. It is global, not
        // per-group, so a public route added later is closed by default rather
        // than silently escaping the kill switch — see EnsureSiteIsServing for
        // the exception list and the test that walks the whole route table.
        $middleware->appendToGroup('api', EnsureSiteIsServing::class);
        // Global for the same reason: the language of a response must not
        // depend on which endpoint was hit, which is precisely what having no
        // such middleware produced — English and Indonesian messages sitting
        // in the same controller.
        $middleware->appendToGroup('api', SetLocale::class);
        $middleware->alias([
            // Sanctum ships this but registers no alias. Without it
            // `auth:sanctum` accepts any unexpired token no matter what it was
            // minted for — which made the 30-day refresh token a full API
            // session. Every protected group carries `abilities:access-api`.
            'abilities' => CheckAbilities::class,
            'admin' => EnsureUserIsAdmin::class,
            'two-factor' => EnsureTwoFactorSatisfied::class,
            'payment-internal' => EnsureUserIsPaymentInternal::class,
            'payment-admin' => EnsureUserIsPaymentAdmin::class,
            'hub' => EnsureHubRequest::class,
            'hub-write' => EnsureHubWriteRequest::class,
            'catalog-local' => EnsureCatalogNotHubManaged::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Keep every API validation failure in the app's own envelope
        // (see App\Traits\ApiResponse::validationErrorResponse) instead of
        // Laravel's default {message, errors} shape.
        $exceptions->render(function (ValidationException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'status' => 'fail',
                    'code' => 422,
                    'message' => $e->getMessage(),
                    'errors' => $e->errors(),
                ], 422);
            }
        });
    })->create();
