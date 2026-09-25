<?php

namespace Tests\Feature;

use App\Actions\Transaction\SendTransactionReceiptAction;
use App\Jobs\SendTransactionWhatsAppJob;
use App\Models\Role;
use App\Models\Transaction;
use App\Models\User;
use App\Services\PiWapiService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WhatsAppReceiptTest extends TestCase
{
    use RefreshDatabase;

    private function configurePiwapi(): void
    {
        config([
            'services.piwapi.enabled' => true,
            'services.piwapi.api_url' => 'https://piwapi.test/send',
            'services.piwapi.account' => 'acc-1',
            'services.piwapi.secret' => 'sec-1',
        ]);
    }

    public function test_whatsapp_job_is_dispatched_alongside_the_receipt(): void
    {
        Mail::fake();
        Bus::fake([SendTransactionWhatsAppJob::class]);

        $transaction = Transaction::factory()->create([
            'guest_contact' => '081234567890',
            'contact_email' => 'guest@example.com',
            'locale' => 'id',
        ]);

        app(SendTransactionReceiptAction::class)->execute($transaction);

        Bus::assertDispatched(SendTransactionWhatsAppJob::class, fn ($job) => $job->transaction->is($transaction) && $job->locale === 'id');
        $this->assertNotNull($transaction->fresh()->whatsapp_sent_at);
    }

    public function test_whatsapp_is_idempotent_without_force(): void
    {
        Mail::fake();
        Bus::fake([SendTransactionWhatsAppJob::class]);

        $transaction = Transaction::factory()->create(['guest_contact' => '081234567890', 'contact_email' => 'g@example.com']);
        $action = app(SendTransactionReceiptAction::class);

        $action->execute($transaction);
        $action->execute($transaction->fresh());

        Bus::assertDispatched(SendTransactionWhatsAppJob::class, 1);
    }

    public function test_whatsapp_resends_on_force(): void
    {
        Mail::fake();
        Bus::fake([SendTransactionWhatsAppJob::class]);

        $transaction = Transaction::factory()->create([
            'guest_contact' => '081234567890',
            'contact_email' => 'g@example.com',
            'whatsapp_sent_at' => now(),
        ]);

        app(SendTransactionReceiptAction::class)->execute($transaction, force: true);

        Bus::assertDispatched(SendTransactionWhatsAppJob::class, 1);
    }

    public function test_whatsapp_not_dispatched_without_a_recipient(): void
    {
        Mail::fake();
        Bus::fake([SendTransactionWhatsAppJob::class]);

        // Guest with no contact number and no member account.
        $transaction = Transaction::factory()->create(['guest_contact' => null, 'contact_email' => 'g@example.com']);

        app(SendTransactionReceiptAction::class)->execute($transaction);

        Bus::assertNotDispatched(SendTransactionWhatsAppJob::class);
        $this->assertNull($transaction->fresh()->whatsapp_sent_at);
    }

    public function test_job_sends_a_document_when_configured(): void
    {
        $this->configurePiwapi();
        Http::fake(['https://piwapi.test/send' => Http::response(['status' => 200, 'data' => ['messageId' => 1]], 200)]);

        $transaction = Transaction::factory()->create(['invoice_number' => 'INV-WA-1', 'guest_contact' => '081234567890']);

        (new SendTransactionWhatsAppJob($transaction, 'id'))->handle(app(PiWapiService::class));

        Http::assertSent(fn ($request) => str_contains($request->body(), 'INV-WA-1')
            && str_contains($request->body(), 'document'));
    }

    public function test_job_is_a_noop_when_unconfigured(): void
    {
        config(['services.piwapi.account' => '', 'services.piwapi.secret' => '']);
        Http::fake();

        $transaction = Transaction::factory()->create(['guest_contact' => '081234567890']);

        (new SendTransactionWhatsAppJob($transaction, 'id'))->handle(app(PiWapiService::class));

        Http::assertNothingSent();
    }

    public function test_job_is_a_noop_when_whatsapp_delivery_is_switched_off(): void
    {
        // WhatsApp is part of the future subscription: credentials may be in
        // place, but a disabled gateway must still not reach the API.
        $this->configurePiwapi();
        config(['services.piwapi.enabled' => false]);
        Http::fake();

        $transaction = Transaction::factory()->create(['guest_contact' => '081234567890']);

        (new SendTransactionWhatsAppJob($transaction, 'id'))->handle(app(PiWapiService::class));

        Http::assertNothingSent();
    }

    /**
     * The admin Integration panel lists probeable channels only. PiWAPI is
     * send-only — there is no balance to ping — so it is deliberately absent
     * from the overview, while its credentials stay manageable through
     * /integration/channels/piwapi (covered by the masking test below).
     */
    public function test_integration_channels_omit_piwapi(): void
    {
        $this->configurePiwapi();
        $role = Role::factory()->create(['name' => 'Admin']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]), ['access-api']);
        Http::fake(['*' => Http::response([], 200)]);

        $channels = collect($this->getJson('/api/v1/integration/channels')->assertOk()->json('data'))->keyBy('id');

        $this->assertArrayNotHasKey('piwapi', $channels);
    }

    public function test_piwapi_credentials_are_readable_and_masked(): void
    {
        $role = Role::factory()->create(['name' => 'Admin']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]), ['access-api']);
        Http::fake(['*' => Http::response([], 200)]);

        // Save credentials, then confirm the secret is masked on read-back.
        $this->putJson('/api/v1/integration/channels/piwapi', [
            'account' => 'my-account',
            'secret' => 'super-secret-1234',
        ])->assertOk();

        $fields = collect($this->getJson('/api/v1/integration/channels/piwapi')->assertOk()->json('data.fields'))->keyBy('key');

        $this->assertSame('my-account', $fields['account']['value']);
        $this->assertStringContainsString('1234', $fields['secret']['value']); // ••••1234
        $this->assertStringNotContainsString('super-secret', $fields['secret']['value']);
    }
}
