<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Role;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TransactionListTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsAdmin(): void
    {
        $role = Role::factory()->create(['name' => 'Admin']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]));
    }

    public function test_transactions_require_authentication(): void
    {
        $this->getJson('/api/v1/transactions')->assertUnauthorized();
    }

    public function test_filters_by_status_and_search(): void
    {
        $this->actingAsAdmin();
        Transaction::factory()->create(['status' => 'PENDING', 'invoice_number' => 'INV-AAA']);
        Transaction::factory()->create(['status' => 'COMPLETED', 'invoice_number' => 'INV-BBB']);

        $this->getJson('/api/v1/transactions?status=PENDING')
            ->assertOk()
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.invoice_number', 'INV-AAA');

        $this->getJson('/api/v1/transactions?search=BBB')
            ->assertOk()
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.invoice_number', 'INV-BBB');
    }

    public function test_filters_by_user_product_and_date_range(): void
    {
        $this->actingAsAdmin();
        $memberRole = Role::factory()->create(['name' => 'Member']);
        $user = User::factory()->create(['role_id' => $memberRole->id]);
        $product = Product::factory()->create();

        $inScope = Transaction::factory()->create([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'created_at' => now()->subDays(2),
        ]);
        Transaction::factory()->create(['created_at' => now()->subDays(2)]); // different user/product
        Transaction::factory()->create([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'created_at' => now()->subDays(20), // outside the date range
        ]);

        $this->getJson('/api/v1/transactions?'.http_build_query([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'start_date' => now()->subDays(5)->toDateString(),
            'end_date' => now()->toDateString(),
        ]))
            ->assertOk()
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.id', $inScope->id);
    }

    public function test_sorts_by_amount_total_ascending(): void
    {
        $this->actingAsAdmin();
        Transaction::factory()->create(['amount_total' => 50000, 'invoice_number' => 'INV-HIGH']);
        Transaction::factory()->create(['amount_total' => 10000, 'invoice_number' => 'INV-LOW']);

        $this->getJson('/api/v1/transactions?sort_by=amount_total&sort_dir=asc')
            ->assertOk()
            ->assertJsonPath('data.data.0.invoice_number', 'INV-LOW')
            ->assertJsonPath('data.data.1.invoice_number', 'INV-HIGH');
    }

    public function test_rejects_an_unwhitelisted_sort_column_and_falls_back_to_created_at(): void
    {
        $this->actingAsAdmin();
        $older = Transaction::factory()->create(['created_at' => now()->subDay()]);
        $newer = Transaction::factory()->create(['created_at' => now()]);

        $this->getJson('/api/v1/transactions?sort_by=margin&sort_dir=asc')
            ->assertOk()
            ->assertJsonPath('data.data.0.id', $older->id)
            ->assertJsonPath('data.data.1.id', $newer->id);
    }
}
