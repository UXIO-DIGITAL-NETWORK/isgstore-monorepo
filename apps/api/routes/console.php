<?php

use App\Services\DiscordWebhookService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('payments:sync-expired')
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->runInBackground()
    ->onFailure(fn () => app(DiscordWebhookService::class)->sendAlert('Scheduled command failed: payments:sync-expired'));

// Price checker: updates supplier cost/availability + raises price change
// alerts. No success/before Discord embeds — 288 runs/day would be spam.
Schedule::command('digiflazz:check-prices --type=all')
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->runInBackground()
    ->onFailure(fn () => app(DiscordWebhookService::class)->sendAlert('Scheduled command failed: digiflazz:check-prices'));

// Membership expiry: reverts a lapsed member's role so RolePrice stops quoting
// them a tier they no longer pay for. Daily is enough — a plan's granularity is
// days, and running it more often would just re-scan the same empty set.
Schedule::command('memberships:expire')
    ->dailyAt('00:15')
    ->withoutOverlapping()
    ->runInBackground()
    ->onFailure(fn () => app(DiscordWebhookService::class)->sendAlert('Scheduled command failed: memberships:expire'));

// Service billing expiry: closes lapsed subscriptions so the client's "Active
// until" card stops lying, and overdue UNPAID invoices so an abandoned request
// stops blocking a fresh order for the same service. Daily, like memberships —
// the granularity of a billing period is days.
Schedule::command('services:expire')
    ->dailyAt('00:20')
    ->withoutOverlapping()
    ->runInBackground()
    ->onFailure(fn () => app(DiscordWebhookService::class)->sendAlert('Scheduled command failed: services:expire'));
