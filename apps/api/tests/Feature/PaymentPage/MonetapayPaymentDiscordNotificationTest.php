<?php

declare(strict_types=1);

namespace Tests\Feature\PaymentPage;

use App\Actions\Payment\Monetapay\HandleMonetapayCallbackAction;
use App\DTOs\Payment\Monetapay\MonetapayCallbackDTO;
use App\Models\BalanceTopup;
use App\Models\Payment;
use App\Models\PaymentChannel;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

/**
 * Discord visibility for the Monetapay PAY-IN side (checkout + wallet top-up)
 * — previously only the uxiotopup order-fulfilment webhook notified Discord;
 * a customer's payment itself (success or expiry) was silent.
 */
class MonetapayPaymentDiscordNotificationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['services.discord.webhook_log_url' => 'https://discord.test/hook']);
        Http::fake();
        // The success path also dispatches ProcessUxiotopupTopup — irrelevant to
        // what this file asserts, and faking the queue keeps the test isolated
        // from supplier-order fulfilment (already covered elsewhere).
        Queue::fake();
    }

    private function assertDiscordEmbed(string $expectedTitle, callable $fieldsAssertion): void
    {
        Http::assertSent(function ($request) use ($expectedTitle, $fieldsAssertion) {
            if ($request->url() !== 'https://discord.test/hook') {
                return false;
            }

            $embed = $request['embeds'][0] ?? null;

            return $embed !== null
                && $embed['title'] === $expectedTitle
                && $fieldsAssertion(collect($embed['fields'] ?? []));
        });
    }

    public function test_a_successful_checkout_payment_notifies_discord(): void
    {
        $payment = Payment::factory()->create([
            'reference_id' => 'PAY-TEST-CHECKOUT-01',
            'gross_amount' => 55000,
            'status' => '1',
        ]);
        $payment->transaction()->update(['status' => 'PENDING', 'amount_total' => 55000]);

        app(HandleMonetapayCallbackAction::class)->execute(new MonetapayCallbackDTO(
            outNo: 'PAY-TEST-CHECKOUT-01',
            amount: 55000,
            status: '3',
            rawPayload: [],
        ));

        $this->assertDiscordEmbed(
            '[MONETAPAY] 💳 Pembayaran Diterima',
            fn ($fields) => $fields->firstWhere('name', '🧾 Invoice')['value'] === '`'.$payment->transaction->invoice_number.'`'
                && $fields->firstWhere('name', '💰 Nominal')['value'] === 'Rp 55,000'
                && str_contains($fields->firstWhere('name', '📊 Status')['value'], 'PAID'),
        );
    }

    public function test_an_expired_checkout_payment_notifies_discord(): void
    {
        $payment = Payment::factory()->create([
            'reference_id' => 'PAY-TEST-CHECKOUT-02',
            'gross_amount' => 30000,
            'status' => '1',
        ]);
        $payment->transaction()->update(['status' => 'PENDING', 'amount_total' => 30000]);

        app(HandleMonetapayCallbackAction::class)->execute(new MonetapayCallbackDTO(
            outNo: 'PAY-TEST-CHECKOUT-02',
            amount: 30000,
            status: 'expired',
            rawPayload: [],
        ));

        $this->assertDiscordEmbed(
            '[MONETAPAY] ⏱️ Pembayaran Kedaluwarsa',
            fn ($fields) => str_contains($fields->firstWhere('name', '📊 Status')['value'], 'EXPIRED'),
        );
    }

    /** A retried webhook on an already-terminal transaction must not double-notify. */
    public function test_a_replayed_checkout_callback_does_not_double_notify(): void
    {
        $payment = Payment::factory()->create([
            'reference_id' => 'PAY-TEST-CHECKOUT-03',
            'gross_amount' => 10000,
            'status' => '3',
        ]);
        $payment->transaction()->update(['status' => 'PAID', 'amount_total' => 10000]);

        app(HandleMonetapayCallbackAction::class)->execute(new MonetapayCallbackDTO(
            outNo: 'PAY-TEST-CHECKOUT-03',
            amount: 10000,
            status: '3',
            rawPayload: [],
        ));

        Http::assertNothingSent();
    }

    public function test_a_successful_topup_notifies_discord(): void
    {
        $user = User::factory()->create(['role_id' => Role::factory()]);
        $channel = PaymentChannel::factory()->create();
        $topup = BalanceTopup::create([
            'user_id' => $user->id,
            'payment_channel_id' => $channel->id,
            'reference_id' => 'TOP-TEST-01',
            'amount' => 50000,
            'admin_fee' => 0,
            'total' => 50000,
            'status' => 'PENDING',
        ]);

        app(HandleMonetapayCallbackAction::class)->execute(new MonetapayCallbackDTO(
            outNo: 'TOP-TEST-01',
            amount: 50000,
            status: '3',
            rawPayload: [],
        ));

        $this->assertDiscordEmbed(
            '[MONETAPAY] 💰 Top Up Saldo Berhasil',
            fn ($fields) => $fields->firstWhere('name', '🧾 Referensi')['value'] === '`TOP-TEST-01`'
                && $fields->firstWhere('name', '💰 Nominal')['value'] === 'Rp 50,000'
                && str_contains($fields->firstWhere('name', '📊 Status')['value'], 'PAID'),
        );

        $this->assertSame('PAID', $topup->fresh()->status);
    }

    public function test_an_expired_topup_notifies_discord(): void
    {
        $user = User::factory()->create(['role_id' => Role::factory()]);
        $channel = PaymentChannel::factory()->create();
        BalanceTopup::create([
            'user_id' => $user->id,
            'payment_channel_id' => $channel->id,
            'reference_id' => 'TOP-TEST-02',
            'amount' => 20000,
            'admin_fee' => 0,
            'total' => 20000,
            'status' => 'PENDING',
        ]);

        app(HandleMonetapayCallbackAction::class)->execute(new MonetapayCallbackDTO(
            outNo: 'TOP-TEST-02',
            amount: 20000,
            status: 'expired',
            rawPayload: [],
        ));

        $this->assertDiscordEmbed(
            '[MONETAPAY] ⏱️ Top Up Saldo Kedaluwarsa',
            fn ($fields) => str_contains($fields->firstWhere('name', '📊 Status')['value'], 'EXPIRED'),
        );
    }

    /** No DISCORD_WEBHOOK_LOG_URL configured — DiscordWebhookService no-ops silently. */
    public function test_no_discord_call_when_webhook_url_is_unset(): void
    {
        config(['services.discord.webhook_log_url' => null]);

        $payment = Payment::factory()->create([
            'reference_id' => 'PAY-TEST-CHECKOUT-04',
            'gross_amount' => 10000,
            'status' => '1',
        ]);
        $payment->transaction()->update(['status' => 'PENDING', 'amount_total' => 10000]);

        app(HandleMonetapayCallbackAction::class)->execute(new MonetapayCallbackDTO(
            outNo: 'PAY-TEST-CHECKOUT-04',
            amount: 10000,
            status: '3',
            rawPayload: [],
        ));

        Http::assertNothingSent();
    }
}
