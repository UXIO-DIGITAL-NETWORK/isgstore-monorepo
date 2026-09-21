<?php

namespace Tests\Feature\PaymentPage;

use App\Models\Role;
use App\Models\Service;
use App\Models\ServiceInvoice;
use App\Models\ServiceSubscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExpireServiceSubscriptionsTest extends TestCase
{
    use RefreshDatabase;

    private function merchant(): User
    {
        return User::factory()->create(['role_id' => Role::firstOrCreate(['name' => 'Payment-Admin'])->id]);
    }

    public function test_a_lapsed_subscription_expires(): void
    {
        $subscription = ServiceSubscription::factory()->expiredWindow()->create([
            'merchant_id' => $this->merchant()->id,
        ]);

        $this->artisan('services:expire')->assertSuccessful();

        $this->assertSame('EXPIRED', $subscription->fresh()->status->value);
    }

    public function test_a_subscription_still_inside_its_window_is_untouched(): void
    {
        $subscription = ServiceSubscription::factory()->create([
            'merchant_id' => $this->merchant()->id,
            'ends_at' => now()->addDays(5),
        ]);

        $this->artisan('services:expire')->assertSuccessful();

        $this->assertSame('ACTIVE', $subscription->fresh()->status->value);
    }

    /**
     * A client who renewed holds a later period for the same service. The old
     * row still closes, but the renewal must survive the same sweep.
     */
    public function test_a_renewed_client_keeps_its_later_period(): void
    {
        $merchant = $this->merchant();
        $service = Service::factory()->create();

        $old = ServiceSubscription::factory()->expiredWindow()->create([
            'merchant_id' => $merchant->id,
            'service_id' => $service->id,
        ]);
        $renewal = ServiceSubscription::factory()->create([
            'merchant_id' => $merchant->id,
            'service_id' => $service->id,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addDays(29),
        ]);

        $this->artisan('services:expire')->assertSuccessful();

        $this->assertSame('EXPIRED', $old->fresh()->status->value);
        $this->assertSame('ACTIVE', $renewal->fresh()->status->value);
    }

    public function test_an_overdue_unpaid_invoice_expires(): void
    {
        $invoice = ServiceInvoice::factory()->create([
            'merchant_id' => $this->merchant()->id,
            'due_at' => now()->subDay(),
        ]);

        $this->artisan('services:expire')->assertSuccessful();

        $this->assertSame('EXPIRED', $invoice->fresh()->status->value);
    }

    /** That state waits on kita, so expiring it would penalise the client. */
    public function test_an_invoice_awaiting_confirmation_is_never_expired(): void
    {
        $invoice = ServiceInvoice::factory()->waitingConfirmation()->create([
            'merchant_id' => $this->merchant()->id,
            'due_at' => now()->subDays(30),
        ]);

        $this->artisan('services:expire')->assertSuccessful();

        $this->assertSame('WAITING_CONFIRMATION', $invoice->fresh()->status->value);
    }

    public function test_dry_run_writes_nothing(): void
    {
        $subscription = ServiceSubscription::factory()->expiredWindow()->create([
            'merchant_id' => $this->merchant()->id,
        ]);
        $invoice = ServiceInvoice::factory()->create([
            'merchant_id' => $this->merchant()->id,
            'due_at' => now()->subDay(),
        ]);

        $this->artisan('services:expire --dry-run')->assertSuccessful();

        $this->assertSame('ACTIVE', $subscription->fresh()->status->value);
        $this->assertSame('UNPAID', $invoice->fresh()->status->value);
    }

    /**
     * A lifetime subscription has no window, so there is nothing to lapse.
     *
     * `ends_at <= now()` already excludes NULL in SQL — this pins it, because the
     * comparison is exactly the kind of thing a later edit "tidies" into
     * sweeping a licence the client paid for outright.
     */
    public function test_a_lifetime_subscription_is_never_expired(): void
    {
        $subscription = ServiceSubscription::factory()->create([
            'merchant_id' => $this->merchant()->id,
            'ends_at' => null,
        ]);

        $this->assertTrue($subscription->isLifetime());

        $this->artisan('services:expire')->assertSuccessful();

        $this->assertSame('ACTIVE', $subscription->fresh()->status->value);
    }

    /**
     * The due date is a DAY, so the day itself is still the client's to pay in.
     *
     * `due_at <= now()` closed a bill at 00:00 on its own due date, and this
     * sweep runs at 00:20 — a full day of the window was gone before the client
     * woke up. Same rule as the payment guard: late from the day after.
     */
    public function test_a_bill_due_today_is_not_expired(): void
    {
        $invoice = ServiceInvoice::factory()->create([
            'merchant_id' => $this->merchant()->id,
            'due_at' => now()->startOfDay(),
        ]);

        $this->artisan('services:expire')->assertSuccessful();

        $this->assertSame('UNPAID', $invoice->fresh()->status->value);
    }
}
