<?php

namespace Tests\Feature\Uxiolabs;

use App\Actions\Uxiolabs\CheckUxiolabsTransactionStatusAction;
use App\Actions\Uxiolabs\ProcessUxiolabsTransactionAction;
use App\Enums\TransactionStatus;
use App\Jobs\PollUxiolabsStatusJob;
use App\Models\Category;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\SupplierProduct;
use App\Models\Transaction;
use App\Services\DiscordWebhookService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class PollUxiolabsStatusTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.uxiolabs.api_key' => 'test-api-key',
            'services.uxiolabs.base_url' => 'https://api.uxiotopup.id',
            'services.uxiolabs.callback_url' => 'https://our.app/api/v1/uxiolabs/callback',
        ]);

        Mail::fake();
    }

    private function processingTransaction(array $overrides = []): Transaction
    {
        return Transaction::factory()->create(array_merge([
            'status' => 'PROCESSING',
            'supplier_trx_id' => 'UXORDER-1',
        ], $overrides));
    }

    private function runJob(Transaction $transaction, ?string $startedAt = null): void
    {
        // Invoked directly (not through the queue), so $this->job is null and the
        // sync no-op guard doesn't fire — this exercises the real polling logic.
        (new PollUxiolabsStatusJob($transaction->id, $startedAt ?? now()->toIso8601String()))
            ->handle(app(CheckUxiolabsTransactionStatusAction::class), app(DiscordWebhookService::class));
    }

    public function test_it_completes_the_order_and_stops_the_chain_on_success(): void
    {
        Queue::fake();
        $transaction = $this->processingTransaction();

        Http::fake(['*/status' => Http::response([
            'status' => true,
            'data' => ['id' => 'UXORDER-1', 'keterangan' => 'SN-42', 'status' => 'success'],
        ])]);

        $this->runJob($transaction);

        $transaction->refresh();
        $this->assertSame(TransactionStatus::COMPLETED, $transaction->status);
        $this->assertSame('SN-42', $transaction->sn);
        $this->assertNotNull($transaction->supplier_status_checked_at);
        Queue::assertNotPushed(PollUxiolabsStatusJob::class); // terminal → chain ends
    }

    public function test_it_keeps_polling_while_the_order_is_still_pending(): void
    {
        Queue::fake();
        $transaction = $this->processingTransaction();

        Http::fake(['*/status' => Http::response([
            'status' => true,
            'data' => ['id' => 'UXORDER-1', 'keterangan' => '', 'status' => 'pending'],
        ])]);

        $this->runJob($transaction);

        $transaction->refresh();
        $this->assertSame(TransactionStatus::PROCESSING, $transaction->status);
        $this->assertNotNull($transaction->supplier_status_checked_at);
        Queue::assertPushed(
            PollUxiolabsStatusJob::class,
            fn (PollUxiolabsStatusJob $job) => $job->transactionId === $transaction->id
        );
    }

    public function test_it_marks_failed_provider_and_stops_on_cancel(): void
    {
        Queue::fake();
        $transaction = $this->processingTransaction();

        Http::fake(['*/status' => Http::response([
            'status' => true,
            'data' => ['id' => 'UXORDER-1', 'keterangan' => '', 'status' => 'cancel'],
        ])]);

        $this->runJob($transaction);

        $this->assertSame(TransactionStatus::FAILED_PROVIDER, $transaction->refresh()->status);
        Queue::assertNotPushed(PollUxiolabsStatusJob::class);
    }

    public function test_it_no_ops_and_stops_when_the_order_is_already_terminal(): void
    {
        Queue::fake();
        Http::fake();
        $transaction = $this->processingTransaction(['status' => 'COMPLETED']);

        $this->runJob($transaction);

        Http::assertNothingSent();
        Queue::assertNotPushed(PollUxiolabsStatusJob::class);
    }

    public function test_a_supplier_error_does_not_kill_the_chain(): void
    {
        Queue::fake();
        $transaction = $this->processingTransaction();

        Http::fake(['*/status' => Http::response(['status' => false, 'msg' => 'order_id tidak ditemukan', 'data' => []])]);

        $this->runJob($transaction);

        // Still PROCESSING, and the chain re-dispatches rather than dying on a blip.
        $this->assertSame(TransactionStatus::PROCESSING, $transaction->refresh()->status);
        Queue::assertPushed(PollUxiolabsStatusJob::class);
    }

    public function test_it_alerts_once_when_stuck_beyond_three_hours_but_keeps_polling(): void
    {
        Queue::fake();
        $this->mock(DiscordWebhookService::class)
            ->shouldReceive('sendAlert')->once();

        $transaction = $this->processingTransaction();
        Http::fake(['*/status' => Http::response([
            'status' => true,
            'data' => ['id' => 'UXORDER-1', 'keterangan' => '', 'status' => 'pending'],
        ])]);

        $this->runJob($transaction, now()->subHours(4)->toIso8601String());

        Queue::assertPushed(PollUxiolabsStatusJob::class); // keeps polling
    }

    // ── Dispatch is wired into order placement ──────────────────────────────

    public function test_placing_an_order_arms_the_poll_chain(): void
    {
        Queue::fake();

        $category = Category::factory()->create([
            'order_form_fields' => [
                'customer_no_template' => '{user_id}|{zone_id}',
                'fields' => [
                    ['key' => 'user_id', 'label' => 'User ID', 'type' => 'number', 'required' => true],
                    ['key' => 'zone_id', 'label' => 'Zone ID', 'type' => 'number', 'required' => true],
                ],
            ],
        ]);
        $product = Product::factory()->create(['category_id' => $category->id]);
        SupplierProduct::factory()
            ->for($product)
            ->for(Supplier::factory()->create(['name' => 'Uxiolabs']))
            ->create(['buyer_sku_code' => 'ML86', 'is_active' => true]);
        $transaction = Transaction::factory()->create([
            'product_id' => $product->id,
            'status' => 'PAID',
            'target_uid' => '983232342',
            'target_server' => '9923',
        ]);

        Http::fake(['*/order' => Http::response([
            'status' => true,
            'data' => ['id' => 'UXORDER-1', 'keterangan' => '', 'status' => 'pending'],
        ])]);

        app(ProcessUxiolabsTransactionAction::class)->execute($transaction);

        $this->assertNotNull($transaction->refresh()->supplier_status_checked_at);
        Queue::assertPushed(
            PollUxiolabsStatusJob::class,
            fn (PollUxiolabsStatusJob $job) => $job->transactionId === $transaction->id
        );
    }

    // ── Reaper: re-arm dead chains, alert unpollable orders ─────────────────

    public function test_reaper_rearms_stale_chains_and_skips_fresh_ones(): void
    {
        Queue::fake();

        $stale = $this->processingTransaction(['supplier_status_checked_at' => now()->subMinutes(11)]);
        $fresh = $this->processingTransaction(['supplier_trx_id' => 'UXORDER-2', 'supplier_status_checked_at' => now()]);

        $this->artisan('uxiolabs:sync-processing')->assertSuccessful();

        Queue::assertPushed(PollUxiolabsStatusJob::class, fn ($job) => $job->transactionId === $stale->id);
        Queue::assertNotPushed(PollUxiolabsStatusJob::class, fn ($job) => $job->transactionId === $fresh->id);
    }

    public function test_reaper_alerts_orders_that_cannot_be_polled(): void
    {
        Queue::fake();
        $this->mock(DiscordWebhookService::class)
            ->shouldReceive('sendAlert')->once();

        $stuck = $this->processingTransaction(['supplier_trx_id' => null]);
        DB::table('transactions')->where('id', $stuck->id)->update(['updated_at' => now()->subMinutes(20)]);

        $this->artisan('uxiolabs:sync-processing')->assertSuccessful();
    }
}
