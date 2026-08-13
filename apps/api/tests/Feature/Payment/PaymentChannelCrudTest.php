<?php

namespace Tests\Feature\Payment;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PaymentChannelCrudTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsAdmin(): void
    {
        $role = Role::factory()->create(['name' => 'Admin']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]));
    }

    public function test_admin_can_create_an_offered_payment_type(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/v1/payment-channels', [
            'payment_type' => 'qris',
            'channel_code' => 'qris',
            'name' => 'QRIS',
        ])->assertCreated();

        $this->assertDatabaseHas('payment_channels', ['channel_code' => 'qris', 'payment_type' => 'qris']);
    }

    public function test_admin_cannot_create_a_disallowed_payment_type(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/v1/payment-channels', [
            'payment_type' => 'convenience_store',
            'channel_code' => 'alfamart',
            'name' => 'Alfamart',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['payment_type']);

        $this->assertDatabaseMissing('payment_channels', ['channel_code' => 'alfamart']);
    }
}
