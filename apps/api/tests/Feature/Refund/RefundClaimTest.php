<?php

namespace Tests\Feature\Refund;

use App\Enums\RefundStatus;
use App\Mail\RefundMail;
use App\Models\Payment;
use App\Models\PaymentChannel;
use App\Models\RefundRequest;
use App\Models\Transaction;
use App\Support\Refund\RefundClaimToken;
use Database\Factories\RefundRequestFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * The public claim surface. Everything here is unauthenticated — the emailed
 * token is the only credential — so the tests are mostly about what must NOT
 * come back.
 */
class RefundClaimTest extends TestCase
{
    use RefreshDatabase;

    /** @return array{0: RefundRequest, 1: string} [refund, plaintext token] */
    private function guestRefund(array $state = []): array
    {
        $channel = PaymentChannel::factory()->create();
        $transaction = Transaction::factory()->create([
            'payment_channel_id' => $channel->id,
            'status' => 'FAILED_PROVIDER',
            'contact_email' => 'guest@example.com',
            'guest_contact' => '081234567890',
        ]);
        $payment = Payment::factory()->create([
            'transaction_id' => $transaction->id,
            'payment_channel_id' => $channel->id,
            'gross_amount' => 12000,
            'status' => '3',
        ]);

        $refund = RefundRequest::factory()->create(array_merge([
            'transaction_id' => $transaction->id,
            'payment_id' => $payment->id,
            'contact_email' => 'guest@example.com',
            'contact_phone' => '081234567890',
        ], $state));

        return [$refund, RefundRequestFactory::$lastClaimToken];
    }

    public function test_the_token_is_stored_only_as_a_hash(): void
    {
        [$refund, $token] = $this->guestRefund();

        $this->assertNotSame($token, $refund->claim_token_hash);
        $this->assertSame(hash('sha256', $token), $refund->claim_token_hash);
        // Even a full row dump must not carry it.
        $this->assertArrayNotHasKey('claim_token_hash', $refund->toArray());
    }

    public function test_the_claim_page_returns_a_narrow_masked_projection(): void
    {
        [$refund, $token] = $this->guestRefund();

        $response = $this->getJson("/api/v1/refund-claims/{$token}")
            ->assertOk()
            ->assertJsonPath('data.refund_number', $refund->refund_number)
            ->assertJsonPath('data.amount', 12000)
            ->assertJsonPath('data.can_submit_payout', true);

        $body = $response->json('data');

        // Nothing about the customer, the merchant, or the sale's economics.
        $this->assertArrayNotHasKey('user_id', $body);
        $this->assertArrayNotHasKey('merchant_id', $body);
        $this->assertArrayNotHasKey('payment_id', $body);
        $this->assertArrayNotHasKey('claim_token', $body);

        // The contact comes back masked — enough to recognise, useless to a
        // stranger who intercepted the link.
        $this->assertStringNotContainsString('guest@example.com', json_encode($body));
        $this->assertStringContainsString('•', (string) $body['contact']['email']);
    }

    public function test_an_unknown_or_expired_token_is_the_same_404(): void
    {
        [$refund, $token] = $this->guestRefund();

        $this->getJson('/api/v1/refund-claims/definitely-not-a-real-token')->assertNotFound();

        $refund->forceFill(['claim_expires_at' => now()->subDay()])->save();
        $this->getJson("/api/v1/refund-claims/{$token}")->assertNotFound();
    }

    public function test_the_customer_can_submit_payout_details_once(): void
    {
        [$refund, $token] = $this->guestRefund();

        $this->postJson("/api/v1/refund-claims/{$token}/payout-details", [
            'bank_code' => 'BCA',
            'account_number' => '1234567890',
            'account_name' => 'Guest Customer',
        ])->assertOk();

        $refund->refresh();
        $this->assertSame(RefundStatus::PENDING, $refund->status);
        $this->assertSame('BCA', $refund->bank_code);
        $this->assertSame('customer', $refund->payout_submitted_by);
        $this->assertNotNull($refund->payout_submitted_at);
    }

    public function test_payout_details_freeze_once_an_admin_is_processing(): void
    {
        [$refund, $token] = $this->guestRefund();
        $refund->forceFill(['status' => RefundStatus::PROCESSING])->save();

        // The destination-swap attack: change the account after an admin has
        // read it but before they press send.
        $this->postJson("/api/v1/refund-claims/{$token}/payout-details", [
            'bank_code' => 'BCA',
            'account_number' => '9999999999',
            'account_name' => 'Someone Else',
        ])->assertUnprocessable();

        $this->assertNotSame('9999999999', $refund->fresh()->account_number);
    }

    public function test_an_unsupported_bank_code_is_rejected(): void
    {
        [, $token] = $this->guestRefund();

        $this->postJson("/api/v1/refund-claims/{$token}/payout-details", [
            'bank_code' => 'NOT-A-BANK',
            'account_number' => '1234567890',
            'account_name' => 'Guest Customer',
        ])->assertUnprocessable();
    }

    public function test_resend_answers_identically_for_a_hit_and_a_miss(): void
    {
        Mail::fake();

        [$refund] = $this->guestRefund();
        $invoice = $refund->transaction->invoice_number;

        $hit = $this->postJson('/api/v1/refund-claims/resend', [
            'invoice_number' => $invoice,
            'contact' => 'guest@example.com',
        ])->assertOk();

        $miss = $this->postJson('/api/v1/refund-claims/resend', [
            'invoice_number' => $invoice,
            'contact' => 'someone-else@example.com',
        ])->assertOk();

        // The whole point: nothing in the response distinguishes them, so this
        // endpoint cannot be used to probe which email owns an order.
        $this->assertSame($hit->json(), $miss->json());
        $this->assertNull($hit->json('data'));

        // But only the real match actually sent anything.
        Mail::assertQueued(RefundMail::class, 1);
    }

    public function test_resend_rotates_the_token_so_the_old_link_dies(): void
    {
        Mail::fake();

        [$refund, $oldToken] = $this->guestRefund();

        $this->postJson('/api/v1/refund-claims/resend', [
            'invoice_number' => $refund->transaction->invoice_number,
            'contact' => '081234567890',
        ])->assertOk();

        $this->assertNull(RefundClaimToken::resolve($oldToken));
        $this->assertNotSame(hash('sha256', $oldToken), $refund->fresh()->claim_token_hash);
    }

    public function test_resend_matches_a_phone_in_any_spelling(): void
    {
        Mail::fake();

        [$refund] = $this->guestRefund();
        $invoice = $refund->transaction->invoice_number;

        foreach (['081234567890', '6281234567890', '+6281234567890'] as $spelling) {
            $this->postJson('/api/v1/refund-claims/resend', [
                'invoice_number' => $invoice,
                'contact' => $spelling,
            ])->assertOk();
        }

        Mail::assertQueued(RefundMail::class, 3);
    }

    public function test_resend_requires_both_the_invoice_and_a_contact(): void
    {
        [$refund] = $this->guestRefund();

        $this->postJson('/api/v1/refund-claims/resend', [
            'invoice_number' => $refund->transaction->invoice_number,
        ])->assertUnprocessable();

        $this->postJson('/api/v1/refund-claims/resend', [
            'contact' => 'guest@example.com',
        ])->assertUnprocessable();
    }

    public function test_the_public_invoice_endpoint_never_leaks_the_claim_token(): void
    {
        [$refund, $token] = $this->guestRefund();

        $body = $this->getJson("/api/v1/invoices/{$refund->transaction->invoice_number}")
            ->assertOk()
            ->assertJsonPath('data.refund.method', 'manual_transfer')
            ->json();

        $encoded = json_encode($body);
        $this->assertStringNotContainsString($token, $encoded);
        $this->assertStringNotContainsString((string) $refund->claim_token_hash, $encoded);
    }
}
