<?php

use App\Services\DiscordWebhookService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Str;
use Illuminate\Support\Stringable;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/**
 * Discord alert for a failed scheduled command that INCLUDES the captured
 * command output — the generic "failed" line alone was not actionable. Typing
 * the callback's `$output` as Illuminate\Support\Stringable makes Laravel store
 * and pass the command's stdout/stderr (see Event::onFailure), so the exception
 * the command printed (e.g. "Price check prepaid failed: …") lands in Discord.
 */
$alertFailure = fn (string $command) => function (Stringable $output) use ($command): void {
    $detail = trim((string) $output);

    app(DiscordWebhookService::class)->sendAlert(
        "Scheduled command failed: {$command}".
        ($detail !== '' ? "\n```\n".Str::limit($detail, 1500)."\n```" : '')
    );
};

Schedule::command('payments:sync-expired')
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->runInBackground()
    ->onFailure($alertFailure('payments:sync-expired'));

// Same job for service bills, which own no `transactions` row and are
// therefore invisible to the command above. Five minutes because the recovery
// half matters: a client whose webhook was lost has genuinely paid and is
// waiting for a subscription.
Schedule::command('service-payments:sync-expired')
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->runInBackground()
    ->onFailure($alertFailure('service-payments:sync-expired'));

// Payout recovery: a PROCESSING withdrawal whose disbursement callback (7.4.2)
// was lost is resolved by polling the payout inquiry (7.4.1) and driving it
// through the same callback handler (settle/refund + idempotency shared).
Schedule::command('withdrawals:sync-processing')
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->runInBackground()
    ->onFailure($alertFailure('withdrawals:sync-processing'));

// Uxiolabs order-status recovery: the supplier callback is unreliable, so each
// in-flight order runs a self-rescheduling PollUxiolabsStatusJob (5s → widening).
// This is only the safety net — it re-arms chains that died and alerts orders that
// cannot be polled (no supplier_trx_id). Five minutes: a paid order awaiting its
// product should not sit unnoticed for long.
Schedule::command('uxiolabs:sync-processing')
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->runInBackground()
    ->onFailure($alertFailure('uxiolabs:sync-processing'));

// Is anyone consuming the queue at all? Every safety net above assumes a live
// worker; if it died, a paid order never reaches the supplier and NOTHING errors.
// This runs on the scheduler — a different process from supervisor — so it can
// still raise the alarm when the worker cannot. Five minutes: the command only
// counts jobs already 5 minutes overdue, so a deploy's brief restart cannot
// trigger it, and the cost is one COUNT query.
//
// The lock is bounded (10 min) rather than left to Laravel's 24-hour default:
// a run killed mid-flight would otherwise hold it and silently disable the very
// alarm meant to catch things dying.
Schedule::command('queue:health')
    ->everyFiveMinutes()
    ->withoutOverlapping(10)
    ->runInBackground()
    ->onFailure($alertFailure('queue:health'));

// Price checker: updates supplier cost/availability, auto-reprices live products
// from the margin rules, and records a price-change log. No success/before Discord
// embeds — 288 runs/day would be spam.
Schedule::command('uxiolabs:check-prices')
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->runInBackground()
    ->onFailure($alertFailure('uxiolabs:check-prices'));

// Gateway-fee reconciliation: audits each channel's gateway fee against the
// Monetapay contract, re-checks the frozen fee on recent settled payments, and
// reconciles the reported balance against our ledger (delta since the last
// snapshot). Daily — fee drift is a slow leak, not a live incident; the command
// alerts Discord itself on any finding, so onFailure only covers a hard crash.
Schedule::command('monetapay:reconcile-fees')
    ->dailyAt('01:00')
    ->withoutOverlapping()
    ->runInBackground()
    ->onFailure($alertFailure('monetapay:reconcile-fees'));

// Membership expiry: reverts a lapsed member's role so RolePrice stops quoting
// them a tier they no longer pay for. Daily is enough — a plan's granularity is
// days, and running it more often would just re-scan the same empty set.
// Before the expiry sweep: renewal writes a successor subscription, which is
// what makes ExpireMemberships see the member as still covered. The two are
// independent — no ordering guarantee is required, this is just tidier.
Schedule::command('memberships:renew')
    ->dailyAt('00:10')
    ->withoutOverlapping()
    ->runInBackground()
    ->onFailure($alertFailure('memberships:renew'));

Schedule::command('memberships:expire')
    ->dailyAt('00:15')
    ->withoutOverlapping()
    ->runInBackground()
    ->onFailure($alertFailure('memberships:expire'));

// Service billing expiry: closes lapsed subscriptions so the client's "Active
// until" card stops lying, and overdue UNPAID invoices so an abandoned request
// stops blocking a fresh order for the same service. Daily, like memberships —
// the granularity of a billing period is days.
Schedule::command('services:expire')
    ->dailyAt('00:20')
    ->withoutOverlapping()
    ->runInBackground()
    ->onFailure($alertFailure('services:expire'));

// Expiring-subscription reminders (H-7 and H-3) for the internal team, so kita
// can chase a renewal before a client's access lapses. Runs after the expiry
// sweep so a package that lapsed overnight is already EXPIRED and skipped. Once
// a day at business hours — the dedupe key makes each threshold fire once.
Schedule::command('subscriptions:notify-expiring')
    ->dailyAt('08:00')
    ->withoutOverlapping()
    ->runInBackground()
    ->onFailure($alertFailure('subscriptions:notify-expiring'));

// Hub pulls: the service catalog and channel fee schedule are owned by the
// Hub and mirrored down on a schedule (pull-only — the Hub never pushes).
// Registered only on hub-managed deployments; a standalone site schedules
// nothing and calls nowhere.
if (config('services.hub.enabled')) {
    Schedule::command('hub:sync-catalog')
        ->everyFifteenMinutes()
        ->withoutOverlapping(30)
        ->runInBackground()
        ->onFailure($alertFailure('hub:sync-catalog'));

    Schedule::command('hub:sync-channels')
        ->everyFifteenMinutes()
        ->withoutOverlapping(30)
        ->runInBackground()
        ->onFailure($alertFailure('hub:sync-channels'));
}
