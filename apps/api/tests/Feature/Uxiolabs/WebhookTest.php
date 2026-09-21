<?php

namespace Tests\Feature\Uxiolabs;

use App\Enums\PaymentStatus;
use App\Enums\TransactionStatus;
use App\Models\Category;
use App\Models\Payment;
use App\Models\PaymentChannel;
use App\Models\Product;
use App\Models\Role;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class WebhookTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // The webhook has no signature — auth is by source IP. Tests run from
        // 127.0.0.1, so allowlist it.
        config(['services.uxiolabs.callback_ips' => '127.0.0.1']);
    }

    private function postWebhook(array $payload)
    {
        return $this->postJson('/api/v1/uxiolabs/callback', $payload);
    }

    public function test_unlisted_source_ip_is_rejected(): void
    {
        config(['services.uxiolabs.callback_ips' => '103.146.202.50']);

        $this->postWebhook(['idtrx' => 'INV-X', 'status' => 'success'])
            ->assertStatus(403);
    }

    public function test_comma_separated_allowlist_accepts_any_listed_ip(): void
    {
        config(['services.uxiolabs.callback_ips' => '103.146.202.50, 127.0.0.1']);

        $this->postWebhook(['idtrx' => 'INV-UNKNOWN', 'status' => 'success'])
            ->assertOk();
    }

    public function test_success_webhook_completes_transaction(): void
    {
        $transaction = Transaction::factory()->create(['status' => 'PROCESSING']);

        $this->postWebhook([
            'id' => 'UX-99',
            'idtrx' => $transaction->invoice_number,
            'keterangan' => 'SN-123',
            'status' => 'success',
        ])->assertOk();

        $transaction->refresh();
        $this->assertSame(TransactionStatus::COMPLETED, $transaction->status);
        $this->assertSame('SN-123', $transaction->sn);
        $this->assertSame('UX-99', $transaction->supplier_trx_id);
    }

    public function test_cancel_webhook_marks_failed_and_refunds_wallet(): void
    {
        $role = Role::factory()->create();
        $user = User::factory()->create(['role_id' => $role->id, 'balance' => 0]);
        $channel = PaymentChannel::factory()->balance()->create();
        $transaction = Transaction::factory()->create([
            'status' => 'PROCESSING',
            'user_id' => $user->id,
            'payment_channel_id' => $channel->id,
        ]);
        Payment::factory()->create([
            'transaction_id' => $transaction->id,
            'payment_channel_id' => $channel->id,
            'gross_amount' => 12000,
            'status' => '3',
        ]);

        $this->postWebhook([
            'id' => 'UX-1',
            'idtrx' => $transaction->invoice_number,
            'keterangan' => '',
            'status' => 'cancel',
        ])->assertOk();

        // A member is refunded inline, so the order does not stop at
        // FAILED_PROVIDER — it lands on REFUNDED, which is what tells the rest
        // of the system (and the merchant balance) the money went back.
        $this->assertSame(TransactionStatus::REFUNDED, $transaction->fresh()->status);
        $this->assertSame(12000, $user->fresh()->balance);
        $this->assertSame(PaymentStatus::REFUNDED, $transaction->payment->fresh()->status);
    }

    public function test_refund_status_also_marks_failed_provider(): void
    {
        $transaction = Transaction::factory()->create(['status' => 'PROCESSING']);

        $this->postWebhook([
            'id' => 'UX-2',
            'idtrx' => $transaction->invoice_number,
            'status' => 'refund',
        ])->assertOk();

        $this->assertSame(TransactionStatus::FAILED_PROVIDER, $transaction->fresh()->status);
    }

    public function test_paid_status_stays_processing(): void
    {
        $transaction = Transaction::factory()->create(['status' => 'PROCESSING']);

        $this->postWebhook([
            'id' => 'UX-3',
            'idtrx' => $transaction->invoice_number,
            'status' => 'paid',
        ])->assertOk();

        $this->assertSame(TransactionStatus::PROCESSING, $transaction->fresh()->status);
    }

    public function test_webhook_replay_on_terminal_transaction_is_ignored(): void
    {
        $transaction = Transaction::factory()->create([
            'status' => 'COMPLETED',
            'sn' => 'SN-ORIGINAL',
        ]);

        $this->postWebhook([
            'idtrx' => $transaction->invoice_number,
            'status' => 'cancel',
            'keterangan' => 'SN-REPLAY',
        ])->assertOk();

        $transaction->refresh();
        $this->assertSame(TransactionStatus::COMPLETED, $transaction->status);
        $this->assertSame('SN-ORIGINAL', $transaction->sn);
    }

    /**
     * The order response may have been lost (duplicate-idtrx path), leaving
     * supplier_trx_id null — the callback carries uxiolabs's own invoice `id`,
     * so it must self-heal the missing reference.
     */
    public function test_webhook_backfills_missing_supplier_trx_id(): void
    {
        $transaction = Transaction::factory()->create([
            'status' => 'PROCESSING',
            'supplier_trx_id' => null,
        ]);

        $this->postWebhook([
            'id' => 'UX-HEAL',
            'idtrx' => $transaction->invoice_number,
            'status' => 'processing',
        ])->assertOk();

        $this->assertSame('UX-HEAL', $transaction->fresh()->supplier_trx_id);
    }

    public function test_payload_without_idtrx_is_accepted_quietly(): void
    {
        $this->postWebhook(['id' => 'UX-NO-REF', 'status' => 'success'])->assertOk();
    }

    /**
     * The Discord notification must show the identifier exactly as it was sent
     * to uxiolabs — the pipe-joined target — so it can be pasted straight into
     * a supplier support ticket.
     */
    public function test_discord_notification_shows_the_combined_target(): void
    {
        config(['services.discord.webhook_log_url' => 'https://discord.test/hook']);
        Http::fake();

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

        $transaction = Transaction::factory()->create([
            'status' => 'PROCESSING',
            'product_id' => $product->id,
            'target_uid' => '63193868',
            'target_server' => '2027',
        ]);

        $this->postWebhook([
            'id' => 'UX-4',
            'idtrx' => $transaction->invoice_number,
            'status' => 'success',
            'keterangan' => 'SN-1',
        ])->assertOk();

        Http::assertSent(function ($request) {
            $target = collect($request['embeds'][0]['fields'] ?? [])
                ->firstWhere('name', '📱 Target');

            return $request->url() === 'https://discord.test/hook'
                && $target !== null
                && $target['value'] === '`63193868|2027`';
        });
    }

    public function test_a_webhook_that_changes_nothing_sends_no_notification(): void
    {
        // uxiolabs re-delivers `processing` while an order is in flight. Each
        // one used to post a `PROCESSING ➔ PROCESSING` embed — half the volume
        // in the operational channel, carrying nothing an operator could act on.
        config(['services.discord.webhook_log_url' => 'https://discord.test/hook']);
        Http::fake();

        $transaction = Transaction::factory()->create([
            'status' => TransactionStatus::PROCESSING,
            'supplier_trx_id' => 'UX-NOOP',
        ]);

        $this->postWebhook([
            'id' => 'UX-NOOP',
            'idtrx' => $transaction->invoice_number,
            'status' => 'processing',
        ])->assertOk();

        // Only the supplier's own progress report is under test here: the
        // transaction's creation notification is this file's fixture talking,
        // not the webhook.
        Http::assertNotSent(fn ($request) => str_starts_with(
            (string) ($request['embeds'][0]['title'] ?? ''),
            '[UXIOLABS]',
        ));
        // The row is still updated — only the announcement is skipped.
        $this->assertSame(TransactionStatus::PROCESSING, $transaction->fresh()->status);
    }

    public function test_discord_target_falls_back_when_the_schema_cannot_be_satisfied(): void
    {
        config(['services.discord.webhook_log_url' => 'https://discord.test/hook']);
        Http::fake();

        // Required zone, but the transaction has none — the formatter throws, and the
        // notification must still go out rather than failing the webhook.
        $category = Category::factory()->create([
            'order_form_fields' => [
                'customer_no_template' => '{user_id}|{zone_id}',
                'fields' => [
                    ['key' => 'user_id', 'label' => 'User ID', 'required' => true],
                    ['key' => 'zone_id', 'label' => 'Zone ID', 'required' => true],
                ],
            ],
        ]);
        $product = Product::factory()->create(['category_id' => $category->id]);

        $transaction = Transaction::factory()->create([
            'status' => 'PROCESSING',
            'product_id' => $product->id,
            'target_uid' => '63193868',
            'target_server' => null,
        ]);

        $this->postWebhook([
            'idtrx' => $transaction->invoice_number,
            'status' => 'success',
        ])->assertOk();

        Http::assertSent(function ($request) {
            $target = collect($request['embeds'][0]['fields'] ?? [])
                ->firstWhere('name', '📱 Target');

            return $target !== null && $target['value'] === '`63193868`';
        });
    }
}
