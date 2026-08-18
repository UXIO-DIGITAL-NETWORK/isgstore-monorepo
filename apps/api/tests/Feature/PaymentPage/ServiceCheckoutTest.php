<?php

namespace Tests\Feature\PaymentPage;

use App\Models\Role;
use App\Models\Service;
use App\Models\ServiceInvoice;
use App\Models\ServiceSubscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ServiceCheckoutTest extends TestCase
{
    use RefreshDatabase;

    private function merchant(): User
    {
        return User::factory()->create(['role_id' => Role::firstOrCreate(['name' => 'Payment-Admin'])->id]);
    }

    public function test_the_checkout_detail_returns_one_active_service(): void
    {
        $service = Service::factory()->create(['name' => 'Digiflazz', 'selling_price' => 250000, 'duration_days' => 30]);
        Sanctum::actingAs($this->merchant());

        $this->getJson("/api/v1/payment-admin/services/{$service->id}")
            ->assertOk()
            ->assertJsonPath('data.name', 'Digiflazz')
            ->assertJsonPath('data.selling_price', 250000)
            ->assertJsonPath('data.duration_days', 30)
            ->assertJsonPath('data.has_open_invoice', false)
            ->assertJsonPath('data.open_invoice_id', null);
    }

    public function test_an_inactive_service_is_not_reachable_by_deep_link(): void
    {
        $service = Service::factory()->inactive()->create();
        Sanctum::actingAs($this->merchant());

        $this->getJson("/api/v1/payment-admin/services/{$service->id}")->assertStatus(404);
    }

    /** With nothing subscribed the new period simply starts today. */
    public function test_the_projected_period_starts_now_when_nothing_is_active(): void
    {
        $service = Service::factory()->create(['duration_days' => 30]);
        Sanctum::actingAs($this->merchant());

        $data = $this->getJson("/api/v1/payment-admin/services/{$service->id}")->json('data');

        $this->assertNull($data['current_period_ends_at']);
        $this->assertSame(
            30,
            (int) round(Carbon::parse($data['projected_starts_at'])->diffInDays(Carbon::parse($data['projected_ends_at']))),
        );
        $this->assertTrue(Carbon::parse($data['projected_starts_at'])->isToday());
    }

    /**
     * Mirrors ConfirmServiceInvoiceAction: renewing early must not throw away
     * the days already paid for, and the checkout page has to say so before
     * the client commits.
     */
    public function test_the_projected_period_stacks_onto_an_active_subscription(): void
    {
        $merchant = $this->merchant();
        $service = Service::factory()->create(['duration_days' => 30]);
        $endsAt = now()->addDays(10);

        ServiceSubscription::factory()->create([
            'merchant_id' => $merchant->id,
            'service_id' => $service->id,
            'starts_at' => now()->subDays(20),
            'ends_at' => $endsAt,
        ]);

        Sanctum::actingAs($merchant);
        $data = $this->getJson("/api/v1/payment-admin/services/{$service->id}")->json('data');

        $this->assertSame(
            $endsAt->toDateString(),
            Carbon::parse($data['projected_starts_at'])->toDateString(),
        );
        $this->assertSame(
            $endsAt->copy()->addDays(30)->toDateString(),
            Carbon::parse($data['projected_ends_at'])->toDateString(),
        );
    }

    public function test_an_open_invoice_is_surfaced_so_confirm_can_be_disabled(): void
    {
        $merchant = $this->merchant();
        $service = Service::factory()->create();
        $invoice = ServiceInvoice::factory()->create([
            'merchant_id' => $merchant->id,
            'service_id' => $service->id,
        ]);

        Sanctum::actingAs($merchant);

        $this->getJson("/api/v1/payment-admin/services/{$service->id}")
            ->assertOk()
            ->assertJsonPath('data.has_open_invoice', true)
            ->assertJsonPath('data.open_invoice_id', $invoice->id);
    }

    public function test_the_invoice_carries_transfer_instructions(): void
    {
        config(['services.service_invoice.bank_name' => 'BCA']);
        $merchant = $this->merchant();
        $invoice = ServiceInvoice::factory()->create(['merchant_id' => $merchant->id]);

        Sanctum::actingAs($merchant);

        $this->getJson("/api/v1/payment-admin/service-invoices/{$invoice->id}")
            ->assertOk()
            ->assertJsonPath('data.transfer_instruction.bank_name', 'BCA')
            ->assertJsonStructure(['data' => ['transfer_instruction' => ['bank_name', 'account_number', 'account_holder', 'note']]]);
    }
}
