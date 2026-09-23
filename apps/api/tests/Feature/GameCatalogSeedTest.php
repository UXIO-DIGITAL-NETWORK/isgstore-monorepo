<?php

namespace Tests\Feature;

use App\Enums\RoleType;
use App\Models\Category;
use App\Models\CategoryType;
use App\Models\MembershipPlan;
use App\Models\PaymentChannel;
use App\Models\PricingRule;
use App\Models\Product;
use App\Models\SupplierProduct;
use App\Models\User;
use App\Support\Auth\Base32;
use App\Support\Auth\Totp;
use App\Support\Hub\HubSystemUser;
use App\Support\Uxiolabs\UxiolabsSupplier;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Guards the seeder contract: the whole DatabaseSeeder runs clean against the
 * current schema, and it produces a STARTER install — configuration and logins,
 * with an empty catalogue.
 *
 * It used to seed one game (Mobile Legends) and 56 of its SKUs, so every fresh
 * install began by deleting someone else's inventory. Inventory now arrives
 * through `uxiolabs:sync-products` or the admin's own Add Product form.
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

        // Two uxiolabs actions resolve this row with firstOrFail, through the one
        // helper that knows every spelling the row has carried — asserted through
        // it rather than against a literal, so a rename cannot pass unnoticed here
        // while breaking the pipeline.
        $this->assertNotNull(UxiolabsSupplier::model());

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

    public function test_it_seeds_exactly_the_four_operator_logins(): void
    {
        $this->seed();

        // Four human operator logins — including the developer account that
        // skips the second factor — plus the non-login Hub system account (no
        // password) that Hub-driven money-path actions are attributed to.
        $this->assertSame(4, User::whereNot('email', HubSystemUser::EMAIL)->count());

        foreach ([
            'admin@uxiotopup.id' => RoleType::ADMIN,
            'developer@uxiotopup.id' => RoleType::ADMIN,
            'internal@uxiotopup.id' => RoleType::PAYMENT_INTERNAL,
            'client@uxiotopup.id' => RoleType::PAYMENT_ADMIN,
        ] as $email => $role) {
            $user = User::where('email', $email)->first();
            $this->assertNotNull($user, "{$email} must be seeded.");
            $this->assertSame($role->value, strtolower((string) $user->role->name));
        }
    }

    public function test_the_seeded_admin_must_enrol_a_second_factor_before_using_the_panel(): void
    {
        $this->seed();

        // The login is only useful if it clears EnsureUserIsAdmin, which matches
        // on the role NAME — a mis-seeded role_id would pass every assertion
        // above and still lock the operator out.
        $token = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@uxiotopup.id',
            'password' => 'uxiolabsJaya123',
        ])->assertOk()->json('data.access_token');

        // **The deployment consequence, pinned here on purpose.** A seeded (or
        // any pre-existing) admin has no second factor, so the panel is closed
        // to them until they enrol — with a machine-readable code so the client
        // routes them to setup instead of showing a generic error.
        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/products')
            ->assertForbidden()
            ->assertJsonPath('data.code', 'two_factor_setup_required');

        // And the way out is open: enrolment lives outside the admin group, so
        // the operator is never stranded.
        $secret = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/auth/2fa/setup')
            ->assertOk()
            ->json('data.secret');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/auth/2fa/confirm', [
                'code' => Totp::at($secret, Totp::timestep()),
            ])->assertOk();
    }

    public function test_an_enrolled_admin_reaches_the_panel_after_a_second_factor(): void
    {
        $this->seed();

        $admin = User::where('email', 'admin@uxiotopup.id')->firstOrFail();
        $secret = Base32::randomSecret();
        $admin->forceFill(['two_factor_secret' => $secret, 'two_factor_confirmed_at' => now()])->save();

        $challenge = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@uxiotopup.id',
            'password' => 'uxiolabsJaya123',
        ])->assertOk()->json('data.challenge_token');

        $this->assertNotNull($challenge, 'A password alone must no longer open the panel.');

        $token = $this->postJson('/api/v1/auth/2fa/verify', [
            'challenge_token' => $challenge,
            'code' => Totp::at($secret, Totp::timestep()),
        ])->assertOk()->json('data.access_token');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/products')
            ->assertOk();
    }

    /**
     * The developer login is the one account the panel lets in without a code.
     *
     * Pinned end to end because it is a deliberate hole: the door must not even
     * offer a challenge, and the panel gate must let the bearer through. If this
     * ever goes green for `admin@uxiotopup.id` instead, the hole has widened.
     */
    public function test_the_seeded_developer_reaches_the_panel_without_a_second_factor(): void
    {
        $this->seed();

        $data = $this->postJson('/api/v1/auth/login', [
            'email' => 'developer@uxiotopup.id',
            'password' => 'uxiolabsJaya123',
        ])->assertOk()->json('data');

        // Straight to a session — no `challenge_token`.
        $this->assertArrayNotHasKey('two_factor_required', $data);
        $this->assertNotNull($data['access_token']);
        // The client routes on this. True here would bounce the account to the
        // setup screen the API would then wave through — the mismatch the shared
        // policy exists to prevent.
        $this->assertFalse($data['user']['two_factor_required']);

        $this->withHeader('Authorization', "Bearer {$data['access_token']}")
            ->getJson('/api/v1/products')
            ->assertOk();
    }

    public function test_every_seeded_membership_plan_is_lifetime(): void
    {
        $this->seed();

        // Three seeded plans plus the free default row the migration inserts —
        // every account without a subscription is priced on that one.
        $plans = MembershipPlan::all();

        $this->assertCount(4, $plans);
        $this->assertCount(1, $plans->where('is_default', true), 'Exactly one plan may be the default.');

        foreach ($plans as $plan) {
            $this->assertTrue($plan->isLifetime(), "Plan {$plan->code} must never expire.");
        }
    }
}
