<?php

namespace Tests\Feature\Storefront;

use App\Models\Category;
use App\Models\Product;
use App\Models\ServerCategory;
use App\Models\ServerCategoryOption;
use App\Models\SupplierProduct;
use App\Support\Storefront\OrderFormFields;
use Database\Seeders\OrderFormSchemaSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Guards the backfill in 2026_07_31_000006_backfill_order_form_schemas.
 *
 * RefreshDatabase runs migrations against an empty database, so the backfill
 * itself finds no rows. These tests therefore re-run its logic against seeded
 * rows to assert the two properties that matter.
 */
class OrderFormBackfillTest extends TestCase
{
    use RefreshDatabase;

    /** Re-runs the migration's up() logic against the current database. */
    private function runBackfill(): void
    {
        foreach (OrderFormSchemaSeeder::schemas() as $code => $schema) {
            DB::table('categories')
                ->where('code', $code)
                ->whereNull('order_form_fields')
                ->update(['order_form_fields' => json_encode($schema)]);
        }
    }

    public function test_backfill_gives_mlbb_a_free_text_zone_instead_of_a_dropdown(): void
    {
        $mlbb = Category::factory()->create(['code' => 'mlbb', 'order_form_fields' => null]);

        // The fabricated Zone 1..5 options that production was rendering.
        $serverCategory = ServerCategory::create(['category_id' => $mlbb->id, 'name' => 'Zone ID']);
        foreach (range(1, 5) as $i) {
            ServerCategoryOption::create([
                'server_category_id' => $serverCategory->id,
                'name' => "Zone {$i}",
                'value' => (string) (2000 + $i),
            ]);
        }

        // Before: the fallback renders a picker of ids that are not real zones.
        $before = OrderFormFields::for($mlbb->fresh());
        $this->assertSame('select', $before[0]['type']);
        $this->assertCount(5, $before[0]['options']);

        $this->runBackfill();

        $after = OrderFormFields::for($mlbb->fresh());

        $this->assertCount(2, $after);
        $this->assertSame('User ID', $after[0]['label']);
        $this->assertSame('Zone ID', $after[1]['label']);

        // The whole point: a zone must be typed in, never chosen from a list.
        // A picker produced wrong ids that only failed at the supplier, after payment.
        $this->assertSame('number', $after[1]['type']);
        $this->assertSame([], $after[1]['options']);
    }

    public function test_backfill_never_overwrites_a_configuration_an_admin_set(): void
    {
        // Admins can edit this column via UpdateCategoryRequest. That is exactly
        // why this is a NULL-guarded migration and not `db:seed` on every deploy.
        $adminSchema = [
            'customer_no_template' => '{user_id}',
            'fields' => [[
                'key' => 'user_id',
                'label' => 'ID Kustom Admin',
                'type' => 'text',
                'required' => true,
            ]],
        ];

        $mlbb = Category::factory()->create(['code' => 'mlbb', 'order_form_fields' => $adminSchema]);

        $this->runBackfill();

        $fields = OrderFormFields::for($mlbb->fresh());

        $this->assertCount(1, $fields);
        $this->assertSame('ID Kustom Admin', $fields[0]['label']);
    }

    public function test_backfill_leaves_unlisted_games_on_the_legacy_fallback(): void
    {
        $other = Category::factory()->create(['code' => 'some-new-game', 'order_form_fields' => null]);

        $this->runBackfill();

        $this->assertNull($other->fresh()->order_form_fields);
    }

    public function test_every_seeded_game_asks_for_typed_input_only(): void
    {
        // No configured schema may declare a select — the storefront must never
        // render a picker for an identity field on any game.
        foreach (OrderFormSchemaSeeder::schemas() as $code => $schema) {
            foreach ($schema['fields'] as $field) {
                $this->assertNotSame(
                    'select',
                    $field['type'] ?? 'text',
                    "Game [{$code}] declares a select for [{$field['key']}]; identity fields must be typed."
                );
            }
        }
    }

    public function test_products_endpoint_serves_the_backfilled_schema(): void
    {
        $mlbb = Category::factory()->create(['code' => 'mlbb', 'slug' => 'mlbb', 'order_form_fields' => null]);
        $product = Product::factory()->create(['category_id' => $mlbb->id, 'status' => true]);
        SupplierProduct::factory()->for($product)->create(['is_active' => true]);

        $this->runBackfill();

        $response = $this->getJson('/api/v1/games/mlbb')->assertOk();

        $this->assertSame('number', $response->json('data.order_form_fields.1.type'));
        $this->assertSame([], $response->json('data.order_form_fields.1.options'));
    }
}
