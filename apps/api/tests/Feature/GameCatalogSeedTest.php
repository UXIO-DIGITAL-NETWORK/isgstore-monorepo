<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\CategoryType;
use App\Support\Storefront\Catalog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Guards the seeder contract: the whole DatabaseSeeder runs clean against the
 * current schema, and it seeds ONLY Mobile Legends — the real uxiotopup
 * catalogue, no other games (Free Fire / Valorant were dropped).
 */
class GameCatalogSeedTest extends TestCase
{
    use RefreshDatabase;

    private const GAME_CODES = ['mlbb'];

    // pulsa/data/etc were never games; freefire/valorant were removed on the
    // uxiotopup migration — none of these may be seeded.
    private const NON_GAME_CODES = ['pulsa', 'data', 'emoney', 'ppob', 'telkomsel', 'freefire', 'valorant'];

    public function test_the_full_seeder_runs_and_seeds_only_mobile_legends(): void
    {
        $this->seed(); // runs DatabaseSeeder end-to-end; throws if any seeder mismatches the schema

        // Exactly the one game category (Mobile Legends).
        $this->assertSame(1, Category::count());
        $this->assertEqualsCanonicalizing(self::GAME_CODES, Category::pluck('code')->all());
        foreach (self::NON_GAME_CODES as $code) {
            $this->assertDatabaseMissing('categories', ['code' => $code]);
        }
    }

    public function test_the_game_has_a_slug_so_the_storefront_can_resolve_it(): void
    {
        $this->seed();

        $this->assertSame('mobile-legends', Category::where('code', 'mlbb')->value('slug'));
        $this->assertNotNull(Catalog::resolveGame('mobile-legends'));
    }

    public function test_the_seeded_game_is_sellable(): void
    {
        $this->seed();

        // Catalog::sellableGames() = active category with an active product that
        // has an active supplier mapping. Mobile Legends must qualify.
        $this->assertSame(1, Catalog::sellableGames()->count());
    }

    public function test_category_types_carry_the_is_voucher_flag(): void
    {
        $this->seed();

        $this->assertTrue((bool) CategoryType::where('name', 'Voucher')->value('is_voucher'));
        $this->assertFalse((bool) CategoryType::where('name', 'Mobile Game')->value('is_voucher'));
    }

    public function test_storefront_games_endpoint_lists_only_mobile_legends(): void
    {
        $this->seed();

        $this->getJson('/api/v1/games')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1);
    }
}
