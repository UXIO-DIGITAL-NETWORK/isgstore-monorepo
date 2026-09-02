<?php

namespace Tests\Feature\Refund;

use App\Actions\Refund\ClaimRefundWithAccountAction;
use App\Actions\Refund\CompleteRefundRequestAction;
use App\Actions\Refund\RejectRefundClaimAction;
use App\DTOs\Refund\CompleteRefundDTO;
use App\Enums\PaymentStatus;
use App\Enums\RefundMethod;
use App\Enums\RefundStatus;
use App\Enums\RoleType;
use App\Enums\TransactionStatus;
use App\Models\BalanceMutation;
use App\Models\Payment;
use App\Models\PaymentChannel;
use App\Models\RefundRequest;
use App\Models\Role;
use App\Models\Transaction;
use App\Models\User;
use App\Support\Refund\RefundClaimToken;
use App\Support\Refund\RefundSla;
use Database\Factories\RefundRequestFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;
use RuntimeException;
use Tests\TestCase;

/**
 * The current guest refund scheme: the money goes back as balance, but only to
 * an account the buyer proves, and only after an admin has verified it.
 *
 * The tests here are mostly about the two things that would cost real money if
 * they were wrong — who is allowed to take the refund, and how many times it
 * can be paid.
 */
class RefundAccountClaimTest extends TestCase
{
    use RefreshDatabase;

    /** @return array{0: RefundRequest, 1: string} [refund, plaintext token] */
    private function claimableRefund(array $state = []): array
    {
        $channel = PaymentChannel::factory()->create();
        $transaction = Transaction::factory()->create([
            'payment_channel_id' => $channel->id,
            'status' => TransactionStatus::FAILED_PROVIDER->value,
            'contact_email' => 'guest@example.com',
            'guest_contact' => '081234567890',
        ]);
        $payment = Payment::factory()->create([
            'transaction_id' => $transaction->id,
            'payment_channel_id' => $channel->id,
            'gross_amount' => 12000,
            'status' => PaymentStatus::SUCCESS->value,
        ]);

        $refund = RefundRequest::factory()->balanceClaim()->create(array_merge([
            'transaction_id' => $transaction->id,
            'payment_id' => $payment->id,
            'contact_email' => 'guest@example.com',
            'contact_phone' => '081234567890',
            'amount' => 12000,
        ], $state));

        return [$refund, RefundRequestFactory::$lastClaimToken];
    }

    private function member(array $attributes = []): User
    {
        $role = Role::factory()->create(['name' => 'Member']);

        return User::factory()->create(array_merge([
            'role_id' => $role->id,
            'balance' => 0,
            'status' => 'active',
        ], $attributes));
    }

    private function admin(): User
    {
        $role = Role::factory()->create(['name' => RoleType::ADMIN->value]);
        $admin = User::factory()->create(['role_id' => $role->id]);
        Sanctum::actingAs($admin, ['access-api']);

        return $admin;
    }

    // ── Claiming ────────────────────────────────────────────────────────────

    public function test_registering_through_the_claim_link_claims_the_refund(): void
    {
        Mail::fake();
        Role::factory()->create(['name' => 'Member']);

        [$refund, $token] = $this->claimableRefund();

        $response = $this->postJson("/api/v1/refund-claims/{$token}/register", [
            'name' => 'Guest Customer',
            'email' => 'guest@example.com',
            'phone' => '081234567890',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
        ])->assertOk();

        $fresh = $refund->fresh();

        $this->assertSame(RefundStatus::PENDING, $fresh->status);
        $this->assertNotNull($fresh->claimed_user_id);
        $this->assertNotNull($fresh->verify_due_at);
        $this->assertSame('email', $fresh->claimed_contact_match);
        // The account is signed in, so the customer can watch it from there.
        $this->assertNotNull($response->json('data.access_token'));

        // Claiming is not paying: nothing has moved yet.
        $this->assertSame(0, (int) User::find($fresh->claimed_user_id)->balance);
        $this->assertSame(0, BalanceMutation::count());
        $this->assertSame(PaymentStatus::SUCCESS, $fresh->transaction->payment->fresh()->status);
    }

    public function test_an_existing_account_can_claim_by_signing_in(): void
    {
        // Unique email and phone mean a returning buyer cannot register again;
        // without this route they would hold a valid link they cannot use.
        $user = $this->member(['email' => 'guest@example.com', 'phone' => '081234567890']);
        [$refund, $token] = $this->claimableRefund();

        Sanctum::actingAs($user, ['access-api']);

        $this->postJson("/api/v1/refund-claims/{$token}/attach")->assertOk();

        $this->assertSame($user->id, $refund->fresh()->claimed_user_id);
    }

    public function test_an_account_whose_contact_does_not_match_the_order_is_refused(): void
    {
        $stranger = $this->member(['email' => 'someone@else.com', 'phone' => '089999999999']);
        [$refund, $token] = $this->claimableRefund();

        Sanctum::actingAs($stranger, ['access-api']);

        $this->postJson("/api/v1/refund-claims/{$token}/attach")->assertStatus(422);

        $this->assertNull($refund->fresh()->claimed_user_id);
        $this->assertSame(RefundStatus::WAITING_ACCOUNT, $refund->fresh()->status);
        $this->assertSame(0, BalanceMutation::count());
    }

    public function test_a_phone_match_is_accepted_in_any_spelling(): void
    {
        $user = $this->member(['email' => 'other@example.com', 'phone' => '+6281234567890']);
        [$refund, $token] = $this->claimableRefund();

        Sanctum::actingAs($user, ['access-api']);

        $this->postJson("/api/v1/refund-claims/{$token}/attach")->assertOk();

        $this->assertSame('phone', $refund->fresh()->claimed_contact_match);
    }

    public function test_the_link_dies_the_moment_it_is_used(): void
    {
        // Otherwise a forwarded copy of the same email lets a second person
        // re-bind the refund to their own account.
        $user = $this->member(['email' => 'guest@example.com', 'phone' => '081234567890']);
        [$refund, $token] = $this->claimableRefund();

        Sanctum::actingAs($user, ['access-api']);
        $this->postJson("/api/v1/refund-claims/{$token}/attach")->assertOk();

        $this->assertNull(RefundClaimToken::resolve($token));
        $this->assertNull($refund->fresh()->claim_token_hash);
        $this->postJson("/api/v1/refund-claims/{$token}/attach")->assertStatus(404);
    }

    public function test_a_second_claim_on_an_already_claimed_refund_is_refused(): void
    {
        $first = $this->member(['email' => 'guest@example.com', 'phone' => '081234567890']);
        $second = $this->member(['email' => 'guest2@example.com', 'phone' => '081234567891']);
        [$refund] = $this->claimableRefund();

        app(ClaimRefundWithAccountAction::class)->execute($refund, $first);

        $this->expectException(RuntimeException::class);
        app(ClaimRefundWithAccountAction::class)->execute($refund->fresh(), $second);
    }

    public function test_the_sla_clock_starts_at_the_claim_and_skips_the_weekend(): void
    {
        // Friday → the two working days are Monday and Tuesday.
        Carbon::setTestNow(Carbon::parse('2026-09-04 10:00:00'));

        $user = $this->member(['email' => 'guest@example.com', 'phone' => '081234567890']);
        [$refund] = $this->claimableRefund();

        app(ClaimRefundWithAccountAction::class)->execute($refund, $user);

        $this->assertSame('2026-09-08', $refund->fresh()->verify_due_at->toDateString());
        $this->assertSame('2026-09-08', RefundSla::dueAt()->toDateString());

        Carbon::setTestNow();
    }

    // ── Paying ──────────────────────────────────────────────────────────────

    public function test_completing_a_claimed_refund_credits_the_balance_once(): void
    {
        Mail::fake();

        $admin = $this->admin();
        $user = $this->member(['email' => 'guest@example.com', 'phone' => '081234567890']);
        [$refund] = $this->claimableRefund();

        app(ClaimRefundWithAccountAction::class)->execute($refund, $user);

        $action = app(CompleteRefundRequestAction::class);
        $action->execute($refund->fresh(), $admin, new CompleteRefundDTO(proofPath: null, note: null));

        $fresh = $refund->fresh(['transaction.payment']);

        $this->assertSame(RefundStatus::COMPLETED, $fresh->status);
        $this->assertNotNull($fresh->refunded_at);
        $this->assertSame(12000, (int) $user->fresh()->balance);
        // The ledger is what the customer reads instead of an order history
        // entry, so the reference has to be the invoice they recognise.
        $this->assertSame(1, BalanceMutation::where('user_id', $user->id)->where('type', 'refund')->count());
        $this->assertSame(
            $fresh->transaction->invoice_number,
            BalanceMutation::where('user_id', $user->id)->first()->reference
        );
        // Cash out, at exactly the moment the credit happened — not before.
        $this->assertSame(PaymentStatus::REFUNDED, $fresh->transaction->payment->status);
        $this->assertSame(TransactionStatus::REFUNDED, $fresh->transaction->status);

        // A second complete must not pay twice.
        $this->expectException(RuntimeException::class);
        $action->execute($fresh, $admin, new CompleteRefundDTO(proofPath: null, note: null));
    }

    public function test_a_suspended_account_is_never_credited(): void
    {
        // Balance it cannot spend is a liability that never discharges, and the
        // customer would be told they had been paid.
        $admin = $this->admin();
        $user = $this->member(['email' => 'guest@example.com', 'phone' => '081234567890']);
        [$refund] = $this->claimableRefund();

        app(ClaimRefundWithAccountAction::class)->execute($refund, $user);
        $user->forceFill(['status' => 'suspended'])->save();

        try {
            app(CompleteRefundRequestAction::class)
                ->execute($refund->fresh(), $admin, new CompleteRefundDTO(proofPath: null, note: null));
            $this->fail('A suspended claimant must not be credited.');
        } catch (RuntimeException $e) {
            $this->assertStringContainsString('tidak aktif', $e->getMessage());
        }

        $this->assertSame(0, (int) $user->fresh()->balance);
        $this->assertSame(RefundStatus::PENDING, $refund->fresh()->status);
        $this->assertSame(0, BalanceMutation::count());
    }

    public function test_an_unclaimed_refund_cannot_be_completed(): void
    {
        $admin = $this->admin();
        [$refund] = $this->claimableRefund(['status' => RefundStatus::PENDING]);

        $this->expectException(RuntimeException::class);
        app(CompleteRefundRequestAction::class)
            ->execute($refund, $admin, new CompleteRefundDTO(proofPath: null, note: null));
    }

    // ── The bank-transfer form must stay shut ────────────────────────────────

    public function test_a_balance_claim_never_opens_the_bank_transfer_form(): void
    {
        // `RefundStatus::payoutEditable()` includes PENDING, which a claimed
        // refund also sits in — a status-only guard would re-open manual
        // transfers on the scheme that retired them.
        $user = $this->member(['email' => 'guest@example.com', 'phone' => '081234567890']);
        [$refund, $token] = $this->claimableRefund();

        $this->getJson("/api/v1/refund-claims/{$token}")
            ->assertOk()
            ->assertJsonPath('data.can_submit_payout', false)
            ->assertJsonPath('data.can_claim_account', true)
            ->assertJsonPath('data.method', RefundMethod::BALANCE_CLAIM->value);

        $this->postJson("/api/v1/refund-claims/{$token}/payout-details", [
            'bank_code' => 'BCA',
            'account_number' => '1234567890',
            'account_name' => 'Guest Customer',
        ])->assertStatus(422);

        $this->assertNull($refund->fresh()->bank_code);

        // And still shut once claimed, when the row has moved into PENDING.
        app(ClaimRefundWithAccountAction::class)->execute($refund, $user);
        $this->assertFalse($refund->fresh()->isPayoutEditable());
    }

    // ── Rejecting the claim, not the refund ─────────────────────────────────

    public function test_rejecting_a_claim_leaves_the_refund_owed_and_claimable(): void
    {
        Mail::fake();

        $admin = $this->admin();
        $suspect = $this->member(['email' => 'guest@example.com', 'phone' => '081234567890']);
        [$refund] = $this->claimableRefund();

        app(ClaimRefundWithAccountAction::class)->execute($refund, $suspect);
        app(RejectRefundClaimAction::class)->execute($refund->fresh(), $admin, 'Kontak tidak meyakinkan');

        $fresh = $refund->fresh();

        // Owed again, and reachable again: a fresh link goes to the contact on
        // the order, never to the account that was just turned away.
        $this->assertSame(RefundStatus::WAITING_ACCOUNT, $fresh->status);
        $this->assertNull($fresh->claimed_user_id);
        $this->assertNull($fresh->user_id);
        $this->assertNull($fresh->verify_due_at);
        $this->assertNotNull($fresh->claim_token_hash);
        $this->assertSame(1, (int) $fresh->claim_rejected_count);
        $this->assertNull($fresh->refunded_at);
        $this->assertSame(0, (int) $suspect->fresh()->balance);
        $this->assertSame(PaymentStatus::SUCCESS, $fresh->transaction->payment->fresh()->status);
    }

    public function test_a_paid_refund_can_no_longer_have_its_claim_rejected(): void
    {
        Mail::fake();

        $admin = $this->admin();
        $user = $this->member(['email' => 'guest@example.com', 'phone' => '081234567890']);
        [$refund] = $this->claimableRefund();

        app(ClaimRefundWithAccountAction::class)->execute($refund, $user);
        app(CompleteRefundRequestAction::class)
            ->execute($refund->fresh(), $admin, new CompleteRefundDTO(proofPath: null, note: null));

        $this->expectException(RuntimeException::class);
        app(RejectRefundClaimAction::class)->execute($refund->fresh(), $admin, 'Terlambat');
    }

    // ── The admin queue ─────────────────────────────────────────────────────

    public function test_the_queue_counts_unclaimed_and_overdue_separately(): void
    {
        $this->admin();
        $user = $this->member(['email' => 'guest@example.com', 'phone' => '081234567890']);

        $this->claimableRefund();
        [$claimed] = $this->claimableRefund(['contact_email' => 'other@example.com', 'contact_phone' => '081111111111']);
        $claimed->forceFill([
            'status' => RefundStatus::PENDING,
            'claimed_user_id' => $user->id,
            'verify_due_at' => now()->subDay(),
        ])->save();

        $this->getJson('/api/v1/refunds/status-counts')
            ->assertOk()
            ->assertJsonPath('data.unclaimed', 1)
            ->assertJsonPath('data.overdue', 1);

        // The paginator sits inside the envelope, so the rows are at data.data.
        $this->getJson('/api/v1/refunds?overdue=1')
            ->assertOk()
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.refund_number', $claimed->refund_number);

        $this->getJson('/api/v1/refunds?unclaimed=1')
            ->assertOk()
            ->assertJsonCount(1, 'data.data');
    }
}
