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

Schedule::command('digiflazz:sync-products --type=all')
    ->dailyAt('04:30')
    ->withoutOverlapping()
    ->runInBackground()
    ->onFailure(fn () => app(DiscordWebhookService::class)->sendAlert('Scheduled command failed: digiflazz:sync-products'));
