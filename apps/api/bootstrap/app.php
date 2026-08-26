<?php

use App\Http\Middleware\EnsureCatalogNotHubManaged;
use App\Http\Middleware\EnsureHubRequest;
use App\Http\Middleware\EnsureUserIsAdmin;
use App\Http\Middleware\EnsureUserIsPaymentAdmin;
use App\Http\Middleware\EnsureUserIsPaymentInternal;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

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
        $middleware->throttleApi();
        $middleware->alias([
            'admin' => EnsureUserIsAdmin::class,
            'payment-internal' => EnsureUserIsPaymentInternal::class,
            'payment-admin' => EnsureUserIsPaymentAdmin::class,
            'hub' => EnsureHubRequest::class,
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
