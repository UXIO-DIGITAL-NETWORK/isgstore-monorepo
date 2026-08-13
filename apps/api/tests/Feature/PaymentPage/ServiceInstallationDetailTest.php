<?php

namespace Tests\Feature\PaymentPage;

use App\Models\Role;
use App\Models\Service;
use App\Models\ServiceInstallation;
use App\Models\ServiceInstallationDetail;
use App\Models\ServiceSubscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Credentials are the one thing in this system that must never leak. Each of
 * these pins one exit route shut.
 */
class ServiceInstallationDetailTest extends TestCase
{
    use RefreshDatabase;

    private const SECRET = 'sk_live_ABCDEFGHIJKLMNOP3f9a';

    private function internal(): User
    {
        return User::factory()->create(['role_id' => Role::firstOrCreate(['name' => 'Payment-Internal'])->id]);
    }

    private function merchant(): User
    {
        return User::factory()->create(['role_id' => Role::firstOrCreate(['name' => 'Payment-Admin'])->id]);
    }

    private function installation(User $merchant): ServiceInstallation
    {
        return ServiceInstallation::factory()->create([
            'merchant_id' => $merchant->id,
            'service_id' => Service::factory()->create()->id,
        ]);
    }

    public function test_a_value_is_encrypted_at_rest(): void
    {
        $detail = ServiceInstallationDetail::factory()->create([
            'service_installation_id' => $this->installation($this->merchant())->id,
            'label' => 'API Key',
            'value' => self::SECRET,
            'is_secret' => true,
        ]);

        $raw = DB::table('service_installation_details')->where('id', $detail->id)->value('value');

        $this->assertNotSame(self::SECRET, $raw);
        $this->assertStringNotContainsString(self::SECRET, (string) $raw);
        $this->assertSame(self::SECRET, Crypt::decryptString((string) $raw));
    }

    /** One code path: there is no branch in which a value is written in the clear. */
    public function test_a_non_secret_value_is_also_encrypted_at_rest(): void
    {
        $detail = ServiceInstallationDetail::factory()->create([
            'service_installation_id' => $this->installation($this->merchant())->id,
            'label' => 'Username',
            'value' => 'uxio-prod',
            'is_secret' => false,
        ]);

        $raw = DB::table('service_installation_details')->where('id', $detail->id)->value('value');

        $this->assertNotSame('uxio-prod', $raw);
        $this->assertSame('uxio-prod', Crypt::decryptString((string) $raw));
    }

    public function test_a_secret_never_appears_in_the_list_response(): void
    {
        $merchant = $this->merchant();
        $installation = $this->installation($merchant);
        ServiceInstallationDetail::factory()->create([
            'service_installation_id' => $installation->id,
            'label' => 'API Key',
            'value' => self::SECRET,
            'is_secret' => true,
        ]);
        $subscription = ServiceSubscription::factory()->create([
            'merchant_id' => $merchant->id,
            'service_id' => $installation->service_id,
        ]);

        Sanctum::actingAs($merchant);
        $response = $this->getJson("/api/v1/payment-admin/service-subscriptions/{$subscription->id}/installation")
            ->assertOk()
            ->assertJsonPath('data.details.0.value', null)
            ->assertJsonPath('data.details.0.is_secret', true);

        $this->assertStringNotContainsString(self::SECRET, $response->getContent());
        // Only the last four characters survive the mask.
        $this->assertSame('••••••••3f9a', $response->json('data.details.0.masked_value'));
    }

    public function test_a_non_secret_value_is_returned_in_full(): void
    {
        $merchant = $this->merchant();
        $installation = $this->installation($merchant);
        ServiceInstallationDetail::factory()->create([
            'service_installation_id' => $installation->id,
            'label' => 'Webhook URL',
            'value' => 'https://uxio.test/callback',
            'is_secret' => false,
        ]);
        $subscription = ServiceSubscription::factory()->create([
            'merchant_id' => $merchant->id,
            'service_id' => $installation->service_id,
        ]);

        Sanctum::actingAs($merchant);
        $this->getJson("/api/v1/payment-admin/service-subscriptions/{$subscription->id}/installation")
            ->assertJsonPath('data.details.0.value', 'https://uxio.test/callback')
            ->assertJsonPath('data.details.0.masked_value', 'https://uxio.test/callback');
    }

    public function test_reveal_returns_the_plaintext_to_the_owner_and_forbids_caching(): void
    {
        $merchant = $this->merchant();
        $detail = ServiceInstallationDetail::factory()->secret()->create([
            'service_installation_id' => $this->installation($merchant)->id,
            'value' => self::SECRET,
        ]);

        Sanctum::actingAs($merchant);
        $response = $this->postJson("/api/v1/payment-admin/installation-details/{$detail->id}/reveal")
            ->assertOk()
            ->assertJsonPath('data.value', self::SECRET);

        $this->assertStringContainsString('no-store', $response->headers->get('Cache-Control'));
    }

    public function test_reveal_is_404_for_another_client(): void
    {
        $owner = $this->merchant();
        $detail = ServiceInstallationDetail::factory()->secret()->create([
            'service_installation_id' => $this->installation($owner)->id,
        ]);

        Sanctum::actingAs($this->merchant());
        $this->postJson("/api/v1/payment-admin/installation-details/{$detail->id}/reveal")->assertStatus(404);
    }

    public function test_internal_creates_a_detail_without_echoing_the_value_back(): void
    {
        $installation = $this->installation($this->merchant());

        Sanctum::actingAs($this->internal());
        $response = $this->postJson("/api/v1/payment-internal/installations/{$installation->id}/detail-items", [
            'label' => 'API Key',
            'value' => self::SECRET,
            'is_secret' => true,
        ])->assertCreated()->assertJsonPath('data.value', null);

        $this->assertStringNotContainsString(self::SECRET, $response->getContent());
    }

    /** Renaming a label must not require re-typing — or re-transmitting — a key. */
    public function test_omitting_value_on_update_preserves_the_stored_secret(): void
    {
        $detail = ServiceInstallationDetail::factory()->secret()->create([
            'service_installation_id' => $this->installation($this->merchant())->id,
            'value' => self::SECRET,
        ]);

        Sanctum::actingAs($this->internal());
        $this->putJson("/api/v1/payment-internal/installation-details/{$detail->id}", ['label' => 'API Key (prod)'])
            ->assertOk()
            ->assertJsonPath('data.label', 'API Key (prod)');

        $this->assertSame(self::SECRET, $detail->fresh()->value);
    }

    /** Closes dd(), Log::info($model), and a careless `return $model`. */
    public function test_the_model_hides_the_value_from_array_serialization(): void
    {
        $detail = ServiceInstallationDetail::factory()->secret()->create([
            'service_installation_id' => $this->installation($this->merchant())->id,
            'value' => self::SECRET,
        ]);

        $this->assertArrayNotHasKey('value', $detail->fresh()->toArray());
        $this->assertStringNotContainsString(self::SECRET, $detail->fresh()->toJson());
    }

    public function test_a_short_secret_is_fully_masked(): void
    {
        $detail = ServiceInstallationDetail::factory()->create([
            'service_installation_id' => $this->installation($this->merchant())->id,
            'value' => 'abc',
            'is_secret' => true,
        ]);

        $this->assertSame('••••••••', $detail->maskedValue());
    }

    public function test_a_client_cannot_write_a_detail(): void
    {
        $merchant = $this->merchant();
        $installation = $this->installation($merchant);

        Sanctum::actingAs($merchant);
        $this->postJson("/api/v1/payment-internal/installations/{$installation->id}/detail-items", [
            'label' => 'x', 'value' => 'y',
        ])->assertStatus(403);
    }
}
