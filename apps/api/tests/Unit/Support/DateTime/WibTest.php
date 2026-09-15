<?php

namespace Tests\Unit\Support\DateTime;

use App\Support\DateTime\Wib;
use Illuminate\Support\Carbon;
use Tests\TestCase;

/**
 * The presentation boundary: instants are stored UTC and rendered WIB.
 *
 * Each assertion is a literal time rather than one derived from a timezone
 * conversion in the test, because the point of the helper is that the wall
 * clock is fixed and the label says which one it is.
 */
class WibTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // The month names come from the app locale, so pin it rather than
        // depend on whatever APP_LOCALE the environment happens to carry.
        $this->app->setLocale('id');
    }

    public function test_it_renders_an_instant_on_the_wib_clock_with_its_label(): void
    {
        // 11:15Z is 18:15 WIB — the string a customer reads on a receipt.
        $this->assertSame(
            '15 Sep 2026, 18:15 WIB (GMT+7)',
            Wib::format(Carbon::parse('2026-09-15T11:15:00Z')),
        );
    }

    public function test_a_date_only_display_keeps_the_short_label(): void
    {
        // An offset beside a calendar day would be noise, but the zone is still
        // worth naming because the day boundary is WIB.
        $this->assertSame('25 Agt 2026 WIB', Wib::date(Carbon::parse('2026-08-25T03:10:00Z')));
    }

    public function test_it_reads_the_wib_day_not_the_utc_one(): void
    {
        // 18:00Z is already the next day in WIB (+7).
        $this->assertSame('16 Sep 2026 WIB', Wib::date(Carbon::parse('2026-09-15T18:00:00Z')));
    }

    public function test_a_missing_instant_stays_null_rather_than_becoming_a_string(): void
    {
        // Callers append the label themselves, so a null must not come back as
        // a rendered string that reads like data.
        $this->assertNull(Wib::format(null));
        $this->assertNull(Wib::date(null));
    }

    public function test_storage_remains_utc(): void
    {
        // The helper is a presentation boundary only. Moving app.timezone would
        // move how every stored instant is written and compared — see
        // PeriodResolver.
        $this->assertSame('UTC', config('app.timezone'));
    }
}
