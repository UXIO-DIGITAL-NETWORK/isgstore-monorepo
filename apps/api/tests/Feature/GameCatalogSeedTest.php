<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\CategoryType;
use App\Support\Storefront\Catalog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Guards the seeder contract: the whole DatabaseSeeder runs clean against the
 * current schema, and it seeds ONLY games — so the storefront lists games and
 * nothing else (this is a game top-up platform).
 */
class GameCatalogSeedTest extends TestCase
{
    use RefreshDatabase;

    private const GAME_CODES = ['mlbb', 'freefire', 'valorant'];

    private const NON_GAME_CODES = ['pulsa', 'data', 'emoney', 'ppob', 'telkomsel'];

    public function test_the_full_seeder_runs_and_seeds_only_games(): void
    {
        $this->seed(); // runs DatabaseSeeder end-to-end; throws if any seeder mismatches the schema

        // Exactly the three game categories, no pulsa/data/e-money/PPOB.
        $this->assertSame(3, Category::count());
        $this->assertEqualsCanonicalizing(self::GAME_CODES, Category::pluck('code')->all());
        foreach (self::NON_GAME_CODES as $code) {
            $this->assertDatabaseMissing('categories', ['code' => $code]);
        }
    }

    public function test_games_have_a_slug_so_the_storefront_can_resolve_them(): void
    {
        $this->seed();

        $this->assertSame('mobile-legends', Category::where('code', 'mlbb')->value('slug'));
        $this->assertNotNull(Catalog::resolveGame('mobile-legends'));
        $this->assertNotNull(Catalog::resolveGame('free-fire'));
        $this->assertNotNull(Catalog::resolveGame('valorant'));
    }

    public function test_every_seeded_game_is_sellable(): void
    {
        $this->seed();

        // Catalog::sellableGames() = active category with an active product that
        // has an active supplier mapping. All three games must qualify.
        $this->assertSame(3, Catalog::sellableGames()->count());
    }

    public function test_category_types_carry_the_is_voucher_flag(): void
    {
        $this->seed();

        $this->assertTrue((bool) CategoryType::where('name', 'Voucher')->value('is_voucher'));
        $this->assertFalse((bool) CategoryType::where('name', 'Mobile Game')->value('is_voucher'));
    }

    public function test_storefront_games_endpoint_lists_only_the_three_games(): void
    {
        $this->seed();

        $this->getJson('/api/v1/games')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 3);
    }
}
