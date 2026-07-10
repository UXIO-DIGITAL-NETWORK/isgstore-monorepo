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
