<?php

namespace Tests\Feature;

use App\Enums\RoleType;
use App\Models\Category;
use App\Models\CategoryType;
use App\Models\MembershipPlan;
use App\Models\PaymentChannel;
use App\Models\PricingRule;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\SupplierProduct;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Guards the seeder contract: the whole DatabaseSeeder runs clean against the
 * current schema, and it produces a STARTER install — configuration and logins,
 * with an empty catalogue.
 *
 * It used to seed one game (Mobile Legends) and 56 of its SKUs, so every fresh
 * install began by deleting someone else's inventory. Inventory now arrives
 * through `uxiotopup:sync-products` or the admin's own Add Product form.
 */
class GameCatalogSeedTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_full_seeder_runs_and_leaves_the_catalogue_empty(): void
    {
        $this->seed(); // runs DatabaseSeeder end-to-end; throws if any seeder mismatches the schema

        $this->assertSame(0, Category::count(), 'No game may be seeded.');
        $this->assertSame(0, Product::count(), 'No product may be seeded.');
        $this->assertSame(0, SupplierProduct::count(), 'No supplier mapping may be seeded.');
        $this->assertDatabaseCount('sub_categories', 0);
        $this->assertDatabaseCount('transactions', 0);
    }

    public function test_the_storefront_serves_an_empty_catalogue_without_failing(): void
    {
        $this->seed();

        // Empty, not broken — an empty catalogue is a supported state, and the
        // storefront is the first thing anyone opens after seeding.
        $this->getJson('/api/v1/games')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 0);
    }

    public function test_it_seeds_the_master_data_the_admin_cannot_create_a_game_without(): void
    {
        $this->seed();

        // categories.type_id is NOT NULL, so with no category type the admin
        // could never add its first game.
        $this->assertSame(4, CategoryType::count());
        $this->assertTrue((bool) CategoryType::where('name', 'Voucher')->value('is_voucher'));
        $this->assertFalse((bool) CategoryType::where('name', 'Mobile Game')->value('is_voucher'));

        // Two uxiotopup actions resolve this row with firstOrFail.
        $this->assertNotNull(Supplier::where('name', 'Uxiotopup')->first());

        // Markup rules are only editable once the rows exist; PricingService
        // falls back to the same numbers when they do not.
        $this->assertSame(4, PricingRule::whereNull('category_id')->count());
    }

    public function test_it_seeds_the_payment_channels_checkout_needs(): void
    {
        $this->seed();

        // The wallet path is branched on this exact channel_code.
        $this->assertNotNull(PaymentChannel::where('channel_code', 'balance')->first());

        // ...and a guest, who cannot use the wallet, needs at least one channel
        // of a type the storefront is allowed to offer.
        $this->assertTrue(
            PaymentChannel::where('is_active', true)
                ->whereIn('payment_type', PaymentChannel::ALLOWED_STOREFRONT_PAYMENT_TYPES)
                ->exists()
        );
    }

    public function test_it_seeds_exactly_the_three_operator_logins(): void
    {
        $this->seed();

        $this->assertSame(3, User::count());

        foreach ([
            'admin@uxiotopup.id' => RoleType::ADMIN,
            'internal@uxiotopup.id' => RoleType::PAYMENT_INTERNAL,
            'client@uxiotopup.id' => RoleType::PAYMENT_ADMIN,
        ] as $email => $role) {
            $user = User::where('email', $email)->first();
            $this->assertNotNull($user, "{$email} must be seeded.");
            $this->assertSame($role->value, strtolower((string) $user->role->name));
        }
    }

    public function test_the_seeded_admin_can_reach_an_admin_only_endpoint(): void
    {
        $this->seed();

        // The login is only useful if it clears EnsureUserIsAdmin, which matches
        // on the role NAME — a mis-seeded role_id would pass every assertion
        // above and still lock the operator out.
        $token = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@uxiotopup.id',
            'password' => 'uxiotopupJaya123',
        ])->assertOk()->json('data.access_token');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/products')
            ->assertOk();
    }

    public function test_every_seeded_membership_plan_is_lifetime(): void
    {
        $this->seed();

        $plans = MembershipPlan::all();

        $this->assertCount(3, $plans);
        foreach ($plans as $plan) {
            $this->assertTrue($plan->isLifetime(), "Plan {$plan->code} must never expire.");
        }
    }
}
