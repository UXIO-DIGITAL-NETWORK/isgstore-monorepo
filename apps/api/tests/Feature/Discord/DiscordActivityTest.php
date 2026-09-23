<?php

declare(strict_types=1);

namespace Tests\Feature\Discord;

use App\Enums\ServiceInvoiceStatus;
use App\Enums\TransactionStatus;
use App\Enums\WithdrawalStatus;
use App\Models\BalanceTopup;
use App\Models\PaymentChannel;
use App\Models\Role;
use App\Models\ServiceInvoice;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Withdrawal;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * The activity feed: the lifecycle facts the payment callback does not already
 * announce. Every case creates or moves a real model and asserts the embed that
 * leaves the app — the observer wiring is the thing under test, so mocking it
 * away would prove nothing.
 */
class DiscordActivityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['services.discord.webhook_log_url' => 'https://discord.test/hook']);
        Http::fake();
    }

    /** @param callable|null $assert receives the field collection */
    private function assertEmbed(string $expectedTitle, ?callable $assert = null): void
    {
        Http::assertSent(function ($request) use ($expectedTitle, $assert) {
            if ($request->url() !== 'https://discord.test/hook') {
                return false;
            }

            $embed = $request['embeds'][0] ?? null;

            if ($embed === null || $embed['title'] !== $expectedTitle) {
                return false;
            }

            return $assert === null || $assert(collect($embed['fields'] ?? []));
        });
    }

    private function merchant(): User
    {
        return User::factory()->create(['name' => 'Toko A', 'role_id' => Role::factory()]);
    }

    public function test_a_new_transaction_is_announced(): void
    {
        $channel = PaymentChannel::factory()->create(['name' => 'QRIS']);

        Transaction::factory()->create([
            'invoice_number' => 'INV-TEST-1',
            'payment_channel_id' => $channel->id,
            'amount_total' => 55000,
            'status' => TransactionStatus::PENDING,
        ]);

        $this->assertEmbed('[TRANSAKSI] 🛒 Dibuat', fn ($fields) => $fields->firstWhere('name', '🧾 Invoice')['value'] === '`INV-TEST-1`'
            && $fields->firstWhere('name', '💰 Nominal')['value'] === 'Rp 55,000'
            && $fields->firstWhere('name', '💳 Channel')['value'] === 'QRIS'
            && str_contains($fields->firstWhere('name', '📊 Status')['value'], 'PENDING'));
    }

    public function test_a_failed_transaction_is_announced(): void
    {
        $transaction = Transaction::factory()->create([
            'invoice_number' => 'INV-TEST-2',
            'amount_total' => 12000,
        ]);

        $transaction->update(['status' => TransactionStatus::FAILED_PROVIDER]);

        $this->assertEmbed('[TRANSAKSI] 🚨 Gagal', fn ($fields) => $fields->firstWhere('name', '🧾 Invoice')['value'] === '`INV-TEST-2`'
            && str_contains($fields->firstWhere('name', '📊 Status')['value'], 'FAILED_PROVIDER'));
    }

    public function test_a_refunded_transaction_is_announced(): void
    {
        $transaction = Transaction::factory()->create([
            'invoice_number' => 'INV-TEST-3',
            'amount_total' => 12000,
            'status' => TransactionStatus::PAID,
        ]);

        $transaction->update(['status' => TransactionStatus::REFUNDED]);

        $this->assertEmbed('[TRANSAKSI] ↩️ Refund', fn ($fields) => str_contains($fields->firstWhere('name', '📊 Status')['value'], 'REFUNDED'));
    }

    public function test_a_new_wallet_topup_is_announced(): void
    {
        $user = $this->merchant();
        $channel = PaymentChannel::factory()->create(['name' => 'VA BCA']);

        BalanceTopup::create([
            'user_id' => $user->id,
            'payment_channel_id' => $channel->id,
            'reference_id' => 'TOP-TEST-9',
            'amount' => 50000,
            'admin_fee' => 0,
            'total' => 50000,
            'status' => 'PENDING',
        ]);

        $this->assertEmbed('[SALDO] 💳 Top Up Dibuat', fn ($fields) => $fields->firstWhere('name', '🧾 Referensi')['value'] === '`TOP-TEST-9`'
            && $fields->firstWhere('name', '💰 Nominal')['value'] === 'Rp 50,000'
            && $fields->firstWhere('name', '👤 User')['value'] === 'Toko A');
    }

    public function test_a_new_service_invoice_is_announced(): void
    {
        ServiceInvoice::factory()->create([
            'merchant_id' => $this->merchant()->id,
            'invoice_number' => 'SINV-TEST-1',
            'service_name' => 'Langganan Website',
            'amount' => 250000,
        ]);

        $this->assertEmbed('[LAYANAN] 📄 Invoice Dibuat', fn ($fields) => $fields->firstWhere('name', '🧾 Invoice')['value'] === '`SINV-TEST-1`'
            && $fields->firstWhere('name', '📦 Layanan')['value'] === 'Langganan Website'
            && $fields->firstWhere('name', '🏬 Merchant')['value'] === 'Toko A');
    }

    public function test_a_rejected_service_invoice_is_announced(): void
    {
        $invoice = ServiceInvoice::factory()->create([
            'merchant_id' => $this->merchant()->id,
            'invoice_number' => 'SINV-TEST-2',
        ]);

        $invoice->update(['status' => ServiceInvoiceStatus::REJECTED]);

        $this->assertEmbed('[LAYANAN] 📄 Invoice Ditolak', fn ($fields) => str_contains($fields->firstWhere('name', '📊 Status')['value'], 'REJECTED'));
    }

    public function test_a_new_withdrawal_is_announced_and_its_settlement_follows(): void
    {
        $withdrawal = Withdrawal::create([
            'merchant_id' => $this->merchant()->id,
            'withdrawal_number' => 'WD-TEST-1',
            'amount' => 40000,
            'nett' => 38335,
            'bank_code' => 'BCA',
            'account_name' => 'Toko A',
            'status' => WithdrawalStatus::PENDING,
        ]);

        $this->assertEmbed('[PENARIKAN] 🏧 Diajukan', fn ($fields) => $fields->firstWhere('name', '🧾 No. Penarikan')['value'] === '`WD-TEST-1`'
            && $fields->firstWhere('name', '💰 Nominal')['value'] === 'Rp 40,000'
            && $fields->firstWhere('name', '💸 Nett')['value'] === 'Rp 38,335');

        $withdrawal->update(['status' => WithdrawalStatus::SETTLED]);

        $this->assertEmbed('[PENARIKAN] 🏧 Cair', fn ($fields) => str_contains($fields->firstWhere('name', '📊 Status')['value'], 'SETTLED'));
    }

    public function test_it_stays_silent_when_the_webhook_url_is_unset(): void
    {
        config(['services.discord.webhook_log_url' => null]);

        Transaction::factory()->create(['invoice_number' => 'INV-TEST-4']);

        Http::assertNothingSent();
    }
}
