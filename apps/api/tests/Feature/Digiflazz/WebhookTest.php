<?php

namespace Tests\Feature\Digiflazz;

use App\Enums\PaymentStatus;
use App\Enums\TransactionStatus;
use App\Models\Payment;
use App\Models\PaymentChannel;
use App\Models\Role;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WebhookTest extends TestCase
{
    use RefreshDatabase;

    private const SECRET = 'test-webhook-secret';

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.digiflazz.webhook_secret' => self::SECRET]);
    }

    private function postWebhook(array $payload, ?string $secret = self::SECRET)
    {
        $body = json_encode($payload);

        return $this->call(
            'POST',
            '/api/v1/digiflazz/callback',
            [],
            [],
            [],
            [
                'HTTP_X_HUB_SIGNATURE' => 'sha1='.hash_hmac('sha1', $body, (string) $secret),
                'HTTP_X_DIGIFLAZZ_EVENT' => 'update',
                'CONTENT_TYPE' => 'application/json',
            ],
            $body
        );
    }

    public function test_invalid_signature_is_rejected(): void
    {
        $this->postWebhook(['data' => ['ref_id' => 'INV-X']], secret: 'wrong-secret')
            ->assertStatus(403);
    }

    public function test_sukses_webhook_completes_transaction(): void
    {
        $transaction = Transaction::factory()->create(['status' => 'PROCESSING']);

        $this->postWebhook(['data' => [
            'ref_id' => $transaction->invoice_number,
            'status' => 'Sukses',
            'trx_id' => 'DF-99',
            'sn' => 'SN-123',
        ]])->assertOk();

        $transaction->refresh();
        $this->assertSame(TransactionStatus::COMPLETED, $transaction->status);
        $this->assertSame('SN-123', $transaction->sn);
        $this->assertSame('DF-99', $transaction->supplier_trx_id);
    }

    public function test_gagal_webhook_marks_failed_and_refunds_wallet(): void
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

        $this->postWebhook(['data' => [
            'ref_id' => $transaction->invoice_number,
            'status' => 'Gagal',
        ]])->assertOk();

        $this->assertSame(TransactionStatus::FAILED_PROVIDER, $transaction->fresh()->status);
        $this->assertSame(12000, $user->fresh()->balance);
        $this->assertSame(PaymentStatus::REFUNDED, $transaction->payment->fresh()->status);
    }

    public function test_webhook_replay_on_terminal_transaction_is_ignored(): void
    {
        $transaction = Transaction::factory()->create([
            'status' => 'COMPLETED',
            'sn' => 'SN-ORIGINAL',
        ]);

        $this->postWebhook(['data' => [
            'ref_id' => $transaction->invoice_number,
            'status' => 'Gagal',
            'sn' => 'SN-REPLAY',
        ]])->assertOk();

        $transaction->refresh();
        $this->assertSame(TransactionStatus::COMPLETED, $transaction->status);
        $this->assertSame('SN-ORIGINAL', $transaction->sn);
    }

    public function test_ping_event_returns_ok_without_processing(): void
    {
        $this->postWebhook(['hook_id' => 1])->assertOk();
    }
}
