<?php

namespace Tests\Feature\Checkout;

use App\Models\Category;
use App\Models\PaymentChannel;
use App\Models\Product;
use App\Models\SupplierProduct;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

/**
 * Identifier shape is enforced at checkout — i.e. BEFORE payment — instead of
 * failing at Digiflazz after the customer has already paid.
 */
class CheckoutIdentifierValidationTest extends TestCase
{
    use RefreshDatabase;

    private PaymentChannel $channel;

    protected function setUp(): void
    {
        parent::setUp();

        // Never let a test reach a real gateway; these tests assert on validation,
        // and the few that pass validation stop at the faked Monetapay call.
        Http::preventStrayRequests();
        Http::fake(['*' => Http::response(['code' => 0, 'data' => ['order_no' => 'MP1', 'virtual_account' => '8808123']])]);

        $this->channel = PaymentChannel::factory()->create([
            'channel_code' => 'bca_va',
            'payment_type' => 'virtual_account',
            'is_active' => true,
            'min_amount' => 0,
            'fee_flat' => 0,
            'fee_percent' => 0,
        ]);
    }

    private function productFor(?array $schema): Product
    {
        $category = Category::factory()->create(['order_form_fields' => $schema]);
        $product = Product::factory()->create([
            'category_id' => $category->id,
            'status' => true,
            'price_member' => 21500,
        ]);
        SupplierProduct::factory()->for($product)->create(['is_active' => true, 'price' => 19000]);

        return $product;
    }

    private function mlbbSchema(): array
    {
        return [
            'customer_no_template' => '{user_id}{zone_id}',
            'fields' => [
                ['key' => 'user_id', 'label' => 'User ID', 'type' => 'number', 'required' => true, 'min_length' => 6, 'max_length' => 12],
                ['key' => 'zone_id', 'label' => 'Zone ID', 'type' => 'number', 'required' => true, 'min_length' => 3, 'max_length' => 5],
            ],
        ];
    }

    private function checkout(Product $product, array $overrides = []): TestResponse
    {
        return $this->postJson('/api/v1/checkout', array_merge([
            'product_id' => $product->id,
            'payment_channel_id' => $this->channel->id,
            'target_uid' => '123456789',
            'guest_contact' => '08123456789',
        ], $overrides));
    }

    public function test_configured_game_rejects_a_missing_required_zone(): void
    {
        $product = $this->productFor($this->mlbbSchema());

        $this->checkout($product)
            ->assertStatus(422)
            ->assertJsonValidationErrors('target_server')
            // The customer sees the game's own label, not the column name.
            ->assertJsonFragment(['target_server' => ['Zone ID wajib diisi.']]);
    }

    public function test_configured_game_rejects_a_non_numeric_zone(): void
    {
        $product = $this->productFor($this->mlbbSchema());

        $this->checkout($product, ['target_server' => 'asia'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('target_server');
    }

    public function test_configured_game_rejects_a_zone_that_is_too_short(): void
    {
        $product = $this->productFor($this->mlbbSchema());

        $this->checkout($product, ['target_server' => '20'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('target_server');
    }

    public function test_configured_game_rejects_a_non_numeric_uid(): void
    {
        $product = $this->productFor($this->mlbbSchema());

        $this->checkout($product, ['target_uid' => 'abc123456', 'target_server' => '2001'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('target_uid');
    }

    public function test_configured_game_accepts_a_valid_pair(): void
    {
        $product = $this->productFor($this->mlbbSchema());

        $this->checkout($product, ['target_server' => '2001'])
            ->assertStatus(201)
            ->assertJsonPath('data.payment.status', 'PENDING');

        $this->assertDatabaseHas('transactions', [
            'target_uid' => '123456789',
            'target_server' => '2001',
        ]);
    }

    public function test_single_field_game_accepts_a_missing_server(): void
    {
        $product = $this->productFor([
            'customer_no_template' => '{user_id}',
            'fields' => [
                ['key' => 'user_id', 'label' => 'Player ID', 'type' => 'number', 'required' => true, 'min_length' => 6],
            ],
        ]);

        $this->checkout($product)->assertStatus(201);
    }

    public function test_select_field_rejects_a_value_outside_its_options(): void
    {
        $product = $this->productFor([
            'customer_no_template' => '{user_id}{region}',
            'fields' => [
                ['key' => 'user_id', 'label' => 'Riot ID', 'type' => 'text', 'required' => true],
                ['key' => 'region', 'label' => 'Region', 'type' => 'select', 'required' => true,
                    'options' => [['label' => 'Asia Pacific', 'value' => 'ap']]],
            ],
        ]);

        $this->checkout($product, ['target_server' => 'eu'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('target_server');

        $this->checkout($product, ['target_server' => 'ap'])->assertStatus(201);
    }

    public function test_unconfigured_category_keeps_the_previous_permissive_rules(): void
    {
        $product = $this->productFor(null);

        // No zone at all — exactly what used to be allowed, still allowed.
        $this->checkout($product)->assertStatus(201);
    }

    public function test_unconfigured_category_still_requires_a_uid(): void
    {
        $product = $this->productFor(null);

        $this->checkout($product, ['target_uid' => ''])
            ->assertStatus(422)
            ->assertJsonValidationErrors('target_uid');
    }
}
