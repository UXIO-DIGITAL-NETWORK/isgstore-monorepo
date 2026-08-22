<?php

namespace Tests\Feature\Uxiotopup;

use App\Actions\Uxiotopup\ProcessUxiotopupTransactionAction;
use App\Enums\TransactionStatus;
use App\Models\Category;
use App\Models\Product;
use App\Models\Role;
use App\Models\Supplier;
use App\Models\SupplierProduct;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProcessUxiotopupOrderTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.uxiotopup.api_key' => 'test-api-key',
            'services.uxiotopup.base_url' => 'https://api.uxiotopup.id',
            'services.uxiotopup.callback_url' => 'https://our.app/api/v1/uxiotopup/callback',
        ]);
    }

    private function makeTransaction(array $overrides = []): Transaction
    {
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
            ->for(Supplier::factory()->create(['name' => 'Uxiotopup']))
            ->create(['buyer_sku_code' => 'ML86', 'is_active' => true]);

        return Transaction::factory()->create(array_merge([
            'product_id' => $product->id,
            'status' => 'PAID',
            'target_uid' => '983232342',
            'target_server' => '9923',
        ], $overrides));
    }

    private function fakeOrderSuccess(): void
    {
        Http::fake(['*/order' => Http::response([
            'status' => true,
            'msg' => 'Pesanan berhasil! Pesanan akan diproses',
            'data' => [
                'id' => 'UXORDER-1',
                'service_name' => '28 Diamond',
                'service_id' => 'ML86',
                'target' => '983232342|9923',
                'kontak' => '0000000000',
                'keterangan' => '',
                'status' => 'pending',
            ],
        ])]);
    }

    public function test_order_sends_pipe_target_and_persists_uxiotopup_invoice(): void
    {
        $transaction = $this->makeTransaction();
        $this->fakeOrderSuccess();

        app(ProcessUxiotopupTransactionAction::class)->execute($transaction);

        Http::assertSent(function ($request) use ($transaction) {
            return str_ends_with($request->url(), '/order')
                && $request['service_id'] === 'ML86'
                && $request['target'] === '983232342|9923'
                && $request['idtrx'] === $transaction->invoice_number
                && $request['api_key'] === 'test-api-key'
                && $request['callback'] === 'https://our.app/api/v1/uxiotopup/callback';
        });

        $transaction->refresh();
        $this->assertSame('UXORDER-1', $transaction->supplier_trx_id);
        $this->assertSame('pending', $transaction->supplier_status);
        $this->assertSame(TransactionStatus::PROCESSING, $transaction->status);
    }

    public function test_kontak_falls_back_to_guest_contact_then_placeholder(): void
    {
        $transaction = $this->makeTransaction(['user_id' => null, 'guest_contact' => '08123456789']);
        $this->fakeOrderSuccess();

        app(ProcessUxiotopupTransactionAction::class)->execute($transaction);

        Http::assertSent(fn ($request) => $request['kontak'] === '08123456789');
    }

    public function test_kontak_uses_placeholder_when_no_phone_available(): void
    {
        $transaction = $this->makeTransaction(['user_id' => null, 'guest_contact' => null]);
        $this->fakeOrderSuccess();

        app(ProcessUxiotopupTransactionAction::class)->execute($transaction);

        Http::assertSent(fn ($request) => $request['kontak'] === '0000000000');
    }

    public function test_kontak_uses_member_phone_when_present(): void
    {
        $role = Role::factory()->create();
        $user = User::factory()->create(['role_id' => $role->id, 'phone' => '0811111111']);
        $transaction = $this->makeTransaction(['user_id' => $user->id, 'guest_contact' => null]);
        $this->fakeOrderSuccess();

        app(ProcessUxiotopupTransactionAction::class)->execute($transaction);

        Http::assertSent(fn ($request) => $request['kontak'] === '0811111111');
    }

    /**
     * "idtrx sudah ada" means a previous (timed-out) attempt already placed the
     * order. The action must settle to PROCESSING without throwing — rethrowing
     * would re-order or refund a customer whose topup is actually in flight.
     */
    public function test_duplicate_idtrx_settles_to_processing_without_throwing(): void
    {
        $transaction = $this->makeTransaction();

        Http::fake(['*/order' => Http::response([
            'status' => false,
            'msg' => 'idtrx sudah ada',
            'data' => [],
        ])]);

        $result = app(ProcessUxiotopupTransactionAction::class)->execute($transaction);

        $this->assertSame(TransactionStatus::PROCESSING, $result->fresh()->status);
    }

    public function test_other_order_failures_still_throw_for_the_retry_path(): void
    {
        $transaction = $this->makeTransaction();

        Http::fake(['*/order' => Http::response([
            'status' => false,
            'msg' => 'api_key tidak ditemukan',
            'data' => [],
        ])]);

        $this->expectExceptionMessage('api_key tidak ditemukan');

        app(ProcessUxiotopupTransactionAction::class)->execute($transaction);
    }

    // ── Admin check-status endpoint ─────────────────────────────────────────

    private function actingAsAdmin(): void
    {
        $role = Role::factory()->create(['name' => 'Admin']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]));
    }

    public function test_check_status_polls_by_uxiotopup_invoice_and_updates(): void
    {
        $this->actingAsAdmin();
        $transaction = Transaction::factory()->create([
            'status' => 'PROCESSING',
            'supplier_trx_id' => 'UXORDER-9',
        ]);

        Http::fake(['*/status' => Http::response([
            'status' => true,
            'msg' => 'berhasil mengecek status',
            'data' => ['id' => 'UXORDER-9', 'keterangan' => 'SN-42', 'status' => 'success'],
        ])]);

        $this->postJson('/api/v1/uxiotopup/check-status', [
            'invoice_number' => $transaction->invoice_number,
        ])
            ->assertOk()
            ->assertJsonPath('data.status', 'COMPLETED')
            ->assertJsonPath('data.sn', 'SN-42');

        Http::assertSent(fn ($request) => str_ends_with($request->url(), '/status')
            && $request['order_id'] === 'UXORDER-9');
    }

    /**
     * /status only accepts uxiotopup's own invoice id. Without one (order
     * response lost) there is nothing to poll — the endpoint must explain that
     * instead of querying with a wrong key.
     */
    public function test_check_status_rejects_transaction_without_supplier_trx_id(): void
    {
        $this->actingAsAdmin();
        $transaction = Transaction::factory()->create([
            'status' => 'PROCESSING',
            'supplier_trx_id' => null,
        ]);

        Http::fake();

        $this->postJson('/api/v1/uxiotopup/check-status', [
            'invoice_number' => $transaction->invoice_number,
        ])->assertStatus(400);

        Http::assertNothingSent();
    }
}
