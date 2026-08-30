<?php

namespace Tests\Feature\Transaction;

use App\Enums\PaymentStatus;
use App\Enums\ProviderStatus;
use App\Enums\TransactionStatus;
use App\Jobs\ProcessUxiotopupTopup;
use App\Models\Payment;
use App\Models\Transaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The two lifecycles walking apart, along the paths they actually take.
 *
 * The invariant test proves the columns cannot contradict each other; this one
 * proves the provider column says something *useful* at each step — in
 * particular that the three states `TransactionStatus` cannot express are
 * reached by the code paths that should reach them.
 */
class ProviderStatusLifecycleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.uxiotopup.callback_ips' => '127.0.0.1']);
    }

    public function test_a_new_order_has_not_been_sent_to_the_supplier(): void
    {
        $transaction = Transaction::factory()->create(['status' => TransactionStatus::PENDING]);

        $this->assertSame(ProviderStatus::NOT_ORDERED, $transaction->provider_status);
    }

    public function test_an_expired_payment_never_reaches_the_supplier(): void
    {
        $transaction = Transaction::factory()->create(['status' => TransactionStatus::PENDING]);

        $transaction->update(['status' => TransactionStatus::EXPIRED]);

        // The distinction the single column loses: EXPIRED is a payment verdict,
        // and the provider column must not colour it as a supplier failure.
        $this->assertSame(ProviderStatus::NOT_ORDERED, $transaction->fresh()->provider_status);
    }

    public function test_payment_success_queues_fulfilment(): void
    {
        $transaction = Transaction::factory()->create(['status' => TransactionStatus::PENDING]);

        $transaction->update(['status' => TransactionStatus::PAID]);

        $this->assertSame(ProviderStatus::QUEUED, $transaction->fresh()->provider_status);
    }

    public function test_exhausted_retries_are_undelivered_not_rejected(): void
    {
        $transaction = Transaction::factory()->create(['status' => TransactionStatus::PROCESSING]);
        Payment::factory()->create([
            'transaction_id' => $transaction->id,
            'status' => PaymentStatus::SUCCESS,
        ]);

        (new ProcessUxiotopupTopup($transaction))->failed(new \RuntimeException('supplier unreachable'));

        $fresh = $transaction->fresh();

        // A guest's order stays FAILED_PROVIDER until an admin completes the
        // manual transfer — the refund is queued, not paid out. That is exactly
        // why the provider column has to carry its own verdict.
        $this->assertSame(TransactionStatus::FAILED_PROVIDER, $fresh->status);
        $this->assertNotNull($fresh->refundRequest, 'a refund should have been opened');
        // The whole point: retries running out is not the supplier saying no.
        // One is worth retrying by hand, the other is not, and today both write
        // the same FAILED_PROVIDER.
        $this->assertSame(ProviderStatus::UNDELIVERED, $fresh->provider_status);
    }

    public function test_an_explicit_supplier_cancel_is_rejected(): void
    {
        $transaction = Transaction::factory()->create(['status' => TransactionStatus::PROCESSING]);
        Payment::factory()->create([
            'transaction_id' => $transaction->id,
            'status' => PaymentStatus::SUCCESS,
        ]);

        $this->postJson('/api/v1/uxiotopup/callback', [
            'id' => 'UX-1',
            'idtrx' => $transaction->invoice_number,
            'status' => 'cancel',
        ])->assertOk();

        $fresh = $transaction->fresh();

        $this->assertSame(TransactionStatus::FAILED_PROVIDER, $fresh->status);
        $this->assertSame(ProviderStatus::REJECTED, $fresh->provider_status);
    }

    public function test_a_delivered_order_keeps_its_outcome_after_a_refund(): void
    {
        $transaction = Transaction::factory()->create(['status' => TransactionStatus::PROCESSING]);

        $this->postJson('/api/v1/uxiotopup/callback', [
            'id' => 'UX-2',
            'idtrx' => $transaction->invoice_number,
            'keterangan' => 'SN-1',
            'status' => 'success',
        ])->assertOk();

        $this->assertSame(ProviderStatus::DELIVERED, $transaction->fresh()->provider_status);

        // A goodwill refund on a delivered order: money came back, but the
        // supplier did deliver, and that must remain readable.
        $transaction->fresh()->update(['status' => TransactionStatus::REFUNDED]);

        $this->assertSame(ProviderStatus::DELIVERED, $transaction->fresh()->provider_status);
    }

    public function test_an_in_flight_callback_marks_the_order_pollable(): void
    {
        $transaction = Transaction::factory()->create(['status' => TransactionStatus::PROCESSING]);

        $this->postJson('/api/v1/uxiotopup/callback', [
            'id' => 'UX-3',
            'idtrx' => $transaction->invoice_number,
            'status' => 'processing',
        ])->assertOk();

        $this->assertSame(ProviderStatus::ORDERED, $transaction->fresh()->provider_status);
    }

    public function test_a_callback_without_a_supplier_id_is_unconfirmed(): void
    {
        $transaction = Transaction::factory()->create([
            'status' => TransactionStatus::PROCESSING,
            'supplier_trx_id' => null,
        ]);

        $this->postJson('/api/v1/uxiotopup/callback', [
            'idtrx' => $transaction->invoice_number,
            'status' => 'pending',
        ])->assertOk();

        // uxiotopup has the order but we hold no id for it, and /status has no
        // lookup by our own reference — so nothing can poll this one. The reaper
        // finds these; naming the state is what lets it say why.
        $this->assertSame(ProviderStatus::UNCONFIRMED, $transaction->fresh()->provider_status);
        $this->assertContains($transaction->fresh()->provider_status, ProviderStatus::unpollable());
    }
}
