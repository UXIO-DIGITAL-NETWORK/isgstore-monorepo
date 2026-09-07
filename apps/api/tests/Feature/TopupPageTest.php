<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\PaymentChannel;
use App\Models\Product;
use App\Models\ServerCategory;
use App\Models\ServerCategoryOption;
use App\Models\SupplierProduct;
use App\Models\Transaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TopupPageTest extends TestCase
{
    use RefreshDatabase;

    private function sellableProduct(Category $category, array $attributes = []): Product
    {
        $product = Product::factory()->create(array_merge([
            'category_id' => $category->id,
            'status' => true,
        ], $attributes));

        SupplierProduct::factory()->for($product)->create(['is_active' => true]);

        return $product;
    }

    public function test_page_lists_only_games_that_have_a_sellable_product(): void
    {
        $sellable = Category::factory()->create(['name' => 'Mobile Legends']);
        $this->sellableProduct($sellable);

        // Has a product, but no active supplier mapping — checkout would fail, so it must not render.
        $unmapped = Category::factory()->create(['name' => 'Unmapped Game']);
        Product::factory()->create(['category_id' => $unmapped->id, 'status' => true]);

        $empty = Category::factory()->create(['name' => 'Empty Game']);

        $response = $this->get('/topup');

        $response->assertOk()
            ->assertSee('Mobile Legends')
            ->assertDontSee('Unmapped Game')
            ->assertDontSee('Empty Game');
    }

    public function test_page_hides_the_balance_channel_because_guests_cannot_use_it(): void
    {
        $category = Category::factory()->create();
        $this->sellableProduct($category);

        PaymentChannel::factory()->create([
            'channel_code' => 'qris',
            'name' => 'QRIS Payment',
            'is_active' => true,
        ]);
        PaymentChannel::factory()->balance()->create(['name' => 'Saldo Internal']);

        $this->get('/topup')
            ->assertOk()
            ->assertSee('QRIS Payment')
            ->assertDontSee('Saldo Internal');
    }

    public function test_products_endpoint_returns_configured_order_form_fields_first(): void
    {
        $category = Category::factory()->create([
            'order_form_fields' => [
                ['key' => 'user_id', 'label' => 'User ID', 'required' => true],
                ['key' => 'zone_id', 'label' => 'Zone ID', 'required' => true],
            ],
        ]);
        $this->sellableProduct($category);

        // Present, but must be ignored while order_form_fields is populated.
        ServerCategory::create(['category_id' => $category->id, 'name' => 'Ignored']);

        $this->getJson("/topup/games/{$category->id}/products")
            ->assertOk()
            ->assertJsonPath('fields.0.label', 'User ID')
            ->assertJsonPath('fields.1.label', 'Zone ID')
            ->assertJsonCount(2, 'fields');
    }

    public function test_products_endpoint_exposes_the_new_schema_shape_and_drops_the_seeded_dropdown(): void
    {
        $category = Category::factory()->create([
            'order_form_fields' => [
                'customer_no_template' => '{user_id}{zone_id}',
                'fields' => [
                    ['key' => 'user_id', 'label' => 'User ID', 'type' => 'number', 'required' => true,
                        'min_length' => 6, 'max_length' => 12, 'placeholder' => '123456789'],
                    ['key' => 'zone_id', 'label' => 'Zone ID', 'type' => 'number', 'required' => true,
                        'min_length' => 3, 'max_length' => 5, 'help' => 'Angka dalam kurung.'],
                ],
            ],
        ]);
        $this->sellableProduct($category);

        // The fabricated Zone 1-5 dropdown must NOT win over a configured schema.
        $server = ServerCategory::create(['category_id' => $category->id, 'name' => 'Zone ID']);
        ServerCategoryOption::create(['server_category_id' => $server->id, 'name' => 'Zone 1', 'value' => '2001']);

        $response = $this->getJson("/topup/games/{$category->id}/products")->assertOk();

        $response->assertJsonPath('fields.1.type', 'number')
            ->assertJsonPath('fields.1.min_length', 3)
            ->assertJsonPath('fields.1.max_length', 5)
            ->assertJsonPath('fields.1.help', 'Angka dalam kurung.')
            ->assertJsonPath('fields.0.placeholder', '123456789');

        // No select, no fabricated options.
        $this->assertSame([], $response->json('fields.1.options'));

        // The join template is server-side only — it must never reach the client.
        $this->assertArrayNotHasKey('customer_no_template', $response->json());
    }

    public function test_fallback_fields_use_the_same_client_shape(): void
    {
        $category = Category::factory()->create(['order_form_fields' => null]);
        $this->sellableProduct($category);

        $field = $this->getJson("/topup/games/{$category->id}/products")->assertOk()->json('fields.0');

        // Fallback and schema-driven fields must be indistinguishable to the renderer.
        foreach (['key', 'label', 'type', 'required', 'min_length', 'max_length', 'pattern', 'options', 'placeholder', 'help'] as $key) {
            $this->assertArrayHasKey($key, $field);
        }
    }

    public function test_products_endpoint_falls_back_to_server_categories_with_options(): void
    {
        $category = Category::factory()->create(['order_form_fields' => null]);
        $this->sellableProduct($category);

        ServerCategory::create(['category_id' => $category->id, 'name' => 'User ID']);
        $zone = ServerCategory::create(['category_id' => $category->id, 'name' => 'Zone ID']);
        ServerCategoryOption::create([
            'server_category_id' => $zone->id,
            'name' => 'Zone 1',
            'value' => '2001',
        ]);

        $this->getJson("/topup/games/{$category->id}/products")
            ->assertOk()
            ->assertJsonPath('fields.0.type', 'text')
            ->assertJsonPath('fields.1.type', 'select')
            ->assertJsonPath('fields.1.options.0.value', '2001');
    }

    public function test_products_endpoint_falls_back_to_a_generic_user_id_field(): void
    {
        $category = Category::factory()->create(['order_form_fields' => null]);
        $this->sellableProduct($category);

        $this->getJson("/topup/games/{$category->id}/products")
            ->assertOk()
            ->assertJsonCount(1, 'fields')
            ->assertJsonPath('fields.0.key', 'user_id');
    }

    public function test_products_endpoint_omits_products_without_an_active_supplier(): void
    {
        $category = Category::factory()->create();
        $this->sellableProduct($category, ['name' => 'Sellable Denom', 'price_member' => 21500]);

        Product::factory()->create([
            'category_id' => $category->id,
            'name' => 'Unmapped Denom',
            'status' => true,
        ]);

        $inactive = Product::factory()->create([
            'category_id' => $category->id,
            'name' => 'Inactive Denom',
            'status' => false,
        ]);
        SupplierProduct::factory()->for($inactive)->create(['is_active' => true]);

        $response = $this->getJson("/topup/games/{$category->id}/products")->assertOk();

        $names = array_column($response->json('products'), 'name');
        $this->assertSame(['Sellable Denom'], $names);
        $this->assertSame(21500, $response->json('products.0.price'));
    }

    public function test_products_endpoint_never_exposes_cost_price(): void
    {
        $category = Category::factory()->create();
        $this->sellableProduct($category, ['price_modal' => 19000]);

        $response = $this->getJson("/topup/games/{$category->id}/products")->assertOk();

        $response->assertJsonMissing(['price_modal' => 19000]);
        $this->assertArrayNotHasKey('price_modal', $response->json('products.0'));
    }

    public function test_orders_endpoint_returns_only_the_requested_invoices(): void
    {
        $mine = Transaction::factory()->create(['invoice_number' => 'INV-20260728-MINE01']);
        Transaction::factory()->create(['invoice_number' => 'INV-20260728-OTHER1']);

        $response = $this->getJson('/topup/orders?invoices='.$mine->invoice_number)->assertOk();

        $this->assertCount(1, $response->json('data'));
        $this->assertSame('INV-20260728-MINE01', $response->json('data.0.invoice_number'));
    }

    public function test_orders_endpoint_does_not_leak_customer_data(): void
    {
        $transaction = Transaction::factory()->create([
            'invoice_number' => 'INV-20260728-MINE02',
            'guest_contact' => '6281234567890',
            'target_uid' => '987654321',
            'margin' => 2000,
        ]);

        $order = $this->getJson('/topup/orders?invoices='.$transaction->invoice_number)
            ->assertOk()
            ->json('data.0');

        foreach (['guest_contact', 'target_uid', 'margin', 'supplier_id', 'user_id'] as $hidden) {
            $this->assertArrayNotHasKey($hidden, $order);
        }
    }

    public function test_orders_endpoint_handles_a_missing_or_empty_invoice_list(): void
    {
        $this->getJson('/topup/orders')->assertOk()->assertJsonPath('data', []);
        $this->getJson('/topup/orders?invoices=')->assertOk()->assertJsonPath('data', []);
        $this->getJson('/topup/orders?invoices=INV-NOPE')->assertOk()->assertJsonPath('data', []);
    }
}
