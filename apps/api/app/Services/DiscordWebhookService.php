<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Central Discord operational-notification sender.
 *
 * Silently no-ops when services.discord.webhook_log_url is unset and never
 * throws — a broken Discord webhook must not fail the business flow that
 * triggered the notification.
 *
 * **Two things keep this channel worth reading**, both learned from a run that
 * put twenty-nine messages into it inside one minute and buried the only one
 * that needed a human (a merchant balance that could not be debited):
 *
 *  - **Non-production is silent by default.** That flood was factory data — a
 *    seeder on a box whose webhook pointed at the live channel. Set
 *    `DISCORD_SEND_OUTSIDE_PRODUCTION=true` where a staging feed is genuinely
 *    wanted; it arrives prefixed `[STAGING]` so nobody mistakes it for live.
 *  - **Severity is a choice, not a default.** `sendAlert` is the alarm and
 *    should mean "something needs doing now". Routine business events use
 *    `sendNotice`, and anything that is one problem however many rows hit it
 *    uses `sendAlertOnce`.
 */
class DiscordWebhookService
{
    public const COLOR_GREEN = 5763719;

    public const COLOR_RED = 15548997;

    public const COLOR_ORANGE = 16744448;

    public const COLOR_YELLOW = 16705372;

    public const COLOR_BLUE = 3447003;

    /** How long a repeated system-level alert stays suppressed. */
    private const DEDUPE_MINUTES = 60;

    /**
     * @param  array<int,array{name:string,value:string,inline?:bool}>  $fields
     */
    public function sendEmbed(string $title, array $fields = [], int $color = self::COLOR_YELLOW, ?string $description = null): void
    {
        try {
            $webhookUrl = config('services.discord.webhook_log_url');

            if (! $webhookUrl || ! $this->enabled()) {
                return;
            }

            $embed = [
                'title' => $this->label().$title,
                'color' => $color,
                'fields' => $fields,
                'footer' => ['text' => 'Uxio System Auto-Log'],
                'timestamp' => now()->toIso8601String(),
            ];

            if ($description !== null) {
                $embed['description'] = $description;
            }

            Http::post($webhookUrl, ['embeds' => [$embed]]);
        } catch (Throwable $e) {
            Log::error('Discord notification failed: '.$e->getMessage());
        }
    }

    /** Something is wrong and a human needs to act. */
    public function sendAlert(string $message): void
    {
        $this->sendEmbed('🚨 System Alert', [], self::COLOR_RED, $message);
    }

    /**
     * The same alarm as `sendAlert`, raised at most once per `$key` per hour.
     *
     * For a problem that is **one problem however many rows run into it** — a
     * missing `STOREFRONT_URL`, a channel whose fee no longer matches the
     * contract. Reported per row, fifty refunds produced fifty identical
     * messages and pushed everything else off the screen.
     *
     * The window expires rather than latching: silence for an hour is a
     * reminder suppressed, not a problem closed, so an operator who missed the
     * first one hears about it again.
     *
     * Two older call sites roll their own guard with different windows and are
     * left alone: `PollUxiolabsStatusJob` (24 hours, per transaction) and
     * `SyncChannelSettingsFromHubAction` (once per channel per day, because the
     * scheduler runs it 96 times a day). This helper is where a new one should
     * go.
     */
    public function sendAlertOnce(string $key, string $message, int $minutes = self::DEDUPE_MINUTES): void
    {
        // `Cache::add` is the atomic half of this: two workers hitting the same
        // problem at once must still produce one message.
        if (! Cache::add("discord-alert:{$key}", true, now()->addMinutes($minutes))) {
            return;
        }

        $this->sendAlert($message);
    }

    /**
     * A routine business event worth recording, not an alarm.
     *
     * A refund claim, a settled payout — things an operator reads in their own
     * time. Eleven of these wearing the 🚨 badge is what made the badge
     * meaningless.
     */
    public function sendNotice(string $message, string $title = '📋 Log'): void
    {
        $this->sendEmbed($title, [], self::COLOR_BLUE, $message);
    }

    /**
     * Production sends; everywhere else is silent unless it opts in.
     *
     * The guard is on the environment rather than on the caller because the
     * noise came from seeders and fixtures, which never ask before firing the
     * side effects of the actions they call.
     */
    private function enabled(): bool
    {
        // `testing` passes through: a test that configures a webhook URL is
        // deliberately exercising this path, and its HTTP is faked anyway.
        return app()->isProduction()
            || app()->environment('testing')
            || (bool) config('services.discord.send_outside_production');
    }

    /**
     * Marks a non-production feed so it cannot be mistaken for a live one.
     *
     * The prefix is for a human reading the channel, so `testing` is
     * transparent too — labelling there would buy nothing and force every
     * title assertion in the suite to carry it.
     */
    private function label(): string
    {
        if (app()->isProduction() || app()->environment('testing')) {
            return '';
        }

        return '['.strtoupper((string) app()->environment()).'] ';
    }
}
