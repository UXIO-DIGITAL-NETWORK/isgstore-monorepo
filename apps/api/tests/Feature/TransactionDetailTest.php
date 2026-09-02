<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Role;
use App\Models\Supplier;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Covers GET /v1/transactions/{transaction} — the payload the admin's
 * Transaction Detail dialog reads.
 *
 * Cases:
 * - the product's category is present (the admin renders it as "Game"; it was
 *   silently missing because the relation was never eager-loaded)
 * - the payment and supplier fields the dialog depends on are present, so a
 *   future resource trim cannot blank the dialog unnoticed
 */
class TransactionDetailTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsAdmin(): void
    {
        $role = Role::factory()->create(['name' => 'Admin']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]), ['access-api']);
    }

    public function test_show_includes_the_products_category(): void
    {
        $this->actingAsAdmin();
        $category = Category::factory()->create(['name' => 'Mobile Legends']);
        $product = Product::factory()->create(['category_id' => $category->id]);
        $transaction = Transaction::factory()->create(['product_id' => $product->id]);

        $this->getJson("/api/v1/transactions/{$transaction->id}")
            ->assertOk()
            ->assertJsonPath('data.product.category.name', 'Mobile Legends');
    }

    public function test_show_includes_the_payment_and_supplier_detail(): void
    {
        $this->actingAsAdmin();
        $supplier = Supplier::factory()->create(['name' => 'Uxiotopup']);
        $transaction = Transaction::factory()->create([
            'supplier_id' => $supplier->id,
            'amount_base' => 12000,
            'amount_fee' => 1000,
            'channel_fee' => 1000,
            'amount_total' => 13000,
            'supplier_trx_id' => 'SUP-77',
            'supplier_status' => 'success',
        ]);
        Payment::factory()->create([
            'transaction_id' => $transaction->id,
            'reference_id' => 'PAY-REF-01',
            'paid_at' => now(),
        ]);

        $this->getJson("/api/v1/transactions/{$transaction->id}")
            ->assertOk()
            ->assertJsonPath('data.amount_base', 12000)
            ->assertJsonPath('data.channel_fee', 1000)
            ->assertJsonPath('data.supplier.name', 'Uxiotopup')
            ->assertJsonPath('data.supplier_trx_id', 'SUP-77')
            ->assertJsonPath('data.supplier_status', 'success')
            ->assertJsonPath('data.payment.reference_id', 'PAY-REF-01')
            ->assertJsonPath('data.payment.paid_at', fn ($paidAt) => $paidAt !== null);
    }
}
