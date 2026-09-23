<?php

declare(strict_types=1);

namespace Tests\Unit\Support;

use App\Models\Setting;
use App\Support\Payment\PaymentExpiry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The expiry windows, now that an admin can move them.
 *
 * The same reader feeds the reaper job and the invoice countdown, so a
 * disagreement here is a customer watching a timer that the job does not
 * believe. Two properties carry that: the configured value wins, and anything
 * unusable in it degrades to the shipped window rather than to no window at
 * all — a typo must never leave an order pending forever.
 */
class PaymentExpiryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        PaymentExpiry::forget();
    }

    protected function tearDown(): void
    {
        PaymentExpiry::forget();

        parent::tearDown();
    }

    private function configured(string $value): void
    {
        Setting::create([
            'group' => 'operational',
            'key' => PaymentExpiry::SETTING_KEY,
            'value' => $value,
            'type' => 'json',
            'label' => 'Order Expiry (minutes)',
            'is_public' => false,
        ]);
    }

    public function test_the_shipped_windows_apply_when_nothing_is_configured(): void
    {
        $this->assertNull(Setting::where('key', PaymentExpiry::SETTING_KEY)->first());

        $this->assertSame(900, PaymentExpiry::windowFor('virtual_account'));
        $this->assertSame(1200, PaymentExpiry::windowFor('qris'));
        $this->assertSame(86700, PaymentExpiry::windowFor('convenience_store'));
    }

    public function test_a_configured_window_wins(): void
    {
        $this->configured('{"virtual_account":30}');

        // Minutes going in, seconds coming out — the unit the callers expect.
        $this->assertSame(1800, PaymentExpiry::windowFor('virtual_account'));
    }

    public function test_a_method_the_setting_omits_keeps_its_shipped_window(): void
    {
        // Merged over the defaults rather than replacing them: a half-filled
        // setting must not strip expiry from every other method.
        $this->configured('{"virtual_account":30}');

        $this->assertSame(1200, PaymentExpiry::windowFor('qris'));
        $this->assertSame(86700, PaymentExpiry::windowFor('convenience_store'));
    }

    public function test_a_method_we_do_not_know_is_ignored(): void
    {
        $this->configured('{"bitcoin":5}');

        $this->assertNull(PaymentExpiry::windowFor('bitcoin'));
        $this->assertSame(900, PaymentExpiry::windowFor('virtual_account'));
    }

    public function test_a_useless_value_falls_back_rather_than_disabling_expiry(): void
    {
        $this->configured('{"virtual_account":0,"qris":"soon","ewallet":null,"payment_link":-5}');

        $this->assertSame(900, PaymentExpiry::windowFor('virtual_account'));
        $this->assertSame(1200, PaymentExpiry::windowFor('qris'));
        $this->assertSame(7500, PaymentExpiry::windowFor('ewallet'));
        $this->assertSame(36300, PaymentExpiry::windowFor('payment_link'));
    }

    public function test_a_stored_value_that_is_not_a_map_changes_nothing(): void
    {
        $this->configured('15');

        $this->assertSame(900, PaymentExpiry::windowFor('virtual_account'));
    }

    public function test_a_payment_type_with_no_window_stays_null(): void
    {
        // Never guess one: an unknown method is left to the caller.
        $this->assertNull(PaymentExpiry::windowFor('bitcoin'));
        $this->assertNull(PaymentExpiry::windowFor(null));
    }
}
