<?php

namespace Tests\Feature;

use App\Services\DiscordWebhookService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Keeping the operational channel worth reading.
 *
 * Twenty-nine messages arrived in one minute, twenty-eight of which asked
 * nothing of anybody: five supplier webhooks reporting `PROCESSING ➔
 * PROCESSING`, eleven routine refund claims dressed as 🚨 alerts, and four
 * copies of the same misconfiguration. Buried in them was the one that
 * mattered — a merchant balance that could not be debited, money to chase by
 * hand.
 *
 * The flood itself came from factory data seeded onto a box labelled
 * production, but what made it drown the signal is in this codebase: alerts
 * with no dedupe, no-op events that still notify, and business events using the
 * alarm channel. The protections already existed in two places
 * (`NotifyRoleAction`'s `dedupeKey`, `PollUxiolabsStatusJob`'s `Cache::add`);
 * they had simply not been applied here.
 */
class DiscordNoiseTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['services.discord.webhook_log_url' => 'https://discord.test/hook']);
        Http::fake();
    }

    private function service(): DiscordWebhookService
    {
        return app(DiscordWebhookService::class);
    }

    // ── The environment guard ───────────────────────────────────────────────

    public function test_it_stays_quiet_outside_production(): void
    {
        // A seeder run, a `migrate:fresh`, a load test — none of it belongs in
        // the channel an operator watches for real problems.
        app()['env'] = 'local';

        $this->service()->sendAlert('should not leave the building');

        Http::assertNothingSent();
    }

    public function test_a_non_production_box_can_opt_in_and_is_labelled_as_such(): void
    {
        // A staging environment that genuinely wants the feed gets it, marked,
        // so nobody mistakes a staging alarm for a live one.
        app()['env'] = 'staging';
        config(['services.discord.send_outside_production' => true]);

        $this->service()->sendAlert('staging problem');

        Http::assertSent(fn ($request) => str_contains($request['embeds'][0]['title'], '[STAGING]'));
    }

    public function test_production_sends_unlabelled(): void
    {
        app()['env'] = 'production';

        $this->service()->sendAlert('real problem');

        Http::assertSent(fn ($request) => ! str_contains($request['embeds'][0]['title'], '['));
    }

    // ── Dedupe for system-level problems ────────────────────────────────────

    public function test_a_system_wide_problem_is_reported_once_not_once_per_row(): void
    {
        // `STOREFRONT_URL` being unset is one problem however many refunds hit
        // it. Fifty identical messages is how the one that mattered got buried.
        app()['env'] = 'production';

        $this->service()->sendAlertOnce('storefront-url-missing', 'STOREFRONT_URL is not set');
        $this->service()->sendAlertOnce('storefront-url-missing', 'STOREFRONT_URL is not set');
        $this->service()->sendAlertOnce('storefront-url-missing', 'STOREFRONT_URL is not set');

        Http::assertSentCount(1);
    }

    public function test_different_problems_are_still_reported_separately(): void
    {
        app()['env'] = 'production';

        $this->service()->sendAlertOnce('channel-fee:qris', 'QRIS fee diverges');
        $this->service()->sendAlertOnce('channel-fee:bca_va', 'BCA VA fee diverges');

        Http::assertSentCount(2);
    }

    public function test_the_same_problem_is_reported_again_once_the_window_passes(): void
    {
        // Silence for an hour is a reminder suppressed, not a problem closed —
        // an operator who missed the first one must hear about it again.
        app()['env'] = 'production';

        $this->service()->sendAlertOnce('stuck', 'still stuck');
        Cache::flush();
        $this->service()->sendAlertOnce('stuck', 'still stuck');

        Http::assertSentCount(2);
    }

    // ── Routine events are not alarms ───────────────────────────────────────

    public function test_a_routine_event_does_not_wear_the_alarm_badge(): void
    {
        // Eleven refund claims — ordinary workflow — pushed out the single
        // message about money that had to be chased manually.
        app()['env'] = 'production';

        $this->service()->sendNotice('Klaim pengembalian dana: RFD-1');

        Http::assertSent(function ($request) {
            $embed = $request['embeds'][0];

            return ! str_contains($embed['title'], '🚨')
                && $embed['color'] !== DiscordWebhookService::COLOR_RED;
        });
    }
}
