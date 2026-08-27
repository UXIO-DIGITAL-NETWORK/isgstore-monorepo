<?php

namespace App\Providers;

use App\Support\Storefront\Catalog;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureRateLimiting();
        $this->configureRouteBindings();
    }

    /**
     * Storefront URLs address a game by slug, but `categories.slug` is nullable
     * on rows created before it existed and the admin panel links by `code`.
     * Binding through Catalog::resolveGame accepts slug, code or id so no game
     * is unreachable, and it filters inactive games out at the routing layer.
     */
    private function configureRouteBindings(): void
    {
        Route::bind('game', function (string $value) {
            return Catalog::resolveGame($value) ?? abort(404, 'Game tidak ditemukan.');
        });
    }

    private function configureRateLimiting(): void
    {
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(120)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('checkout', function (Request $request) {
            return Limit::perMinute(10)->by($request->user()?->id ?: $request->ip());
        });

        // Generous on purpose: legitimate gateway retry bursts must never be
        // dropped — signature verification is the real gate on these routes.
        RateLimiter::for('webhooks', function (Request $request) {
            return Limit::perMinute(120)->by($request->ip());
        });

        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        // Hub money-path writes: one caller (the Hub) driving a human's clicks,
        // so a modest ceiling — enough for real review bursts, tight enough to
        // blunt a leaked-write-key abuse window.
        RateLimiter::for('hub-write', function (Request $request) {
            return Limit::perMinute(30)->by($request->ip());
        });

        // Config-sync pokes from the Hub. One caller, and the job behind it is
        // unique-for-60s anyway, so this only has to blunt a loop — a panel
        // save burst of a dozen in a minute is normal and must pass.
        RateLimiter::for('hub-sync', function (Request $request) {
            return Limit::perMinute(12)->by($request->ip());
        });
    }
}
