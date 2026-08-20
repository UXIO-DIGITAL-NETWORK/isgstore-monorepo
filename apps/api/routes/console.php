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

// Same job for service bills, which own no `transactions` row and are
// therefore invisible to the command above. Five minutes because the recovery
// half matters: a client whose webhook was lost has genuinely paid and is
// waiting for a subscription.
Schedule::command('service-payments:sync-expired')
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->runInBackground()
    ->onFailure(fn () => app(DiscordWebhookService::class)->sendAlert('Scheduled command failed: service-payments:sync-expired'));

// Payout recovery: a PROCESSING withdrawal whose disbursement callback (7.4.2)
// was lost is resolved by polling the payout inquiry (7.4.1) and driving it
// through the same callback handler (settle/refund + idempotency shared).
Schedule::command('withdrawals:sync-processing')
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->runInBackground()
    ->onFailure(fn () => app(DiscordWebhookService::class)->sendAlert('Scheduled command failed: withdrawals:sync-processing'));

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

// Expiring-subscription reminders (H-7 and H-3) for the internal team, so kita
// can chase a renewal before a client's access lapses. Runs after the expiry
// sweep so a package that lapsed overnight is already EXPIRED and skipped. Once
// a day at business hours — the dedupe key makes each threshold fire once.
Schedule::command('subscriptions:notify-expiring')
    ->dailyAt('08:00')
    ->withoutOverlapping()
    ->runInBackground()
    ->onFailure(fn () => app(DiscordWebhookService::class)->sendAlert('Scheduled command failed: subscriptions:notify-expiring'));
