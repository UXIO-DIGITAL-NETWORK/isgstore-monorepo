<?php

namespace Tests\Feature\Storefront;

use App\Models\Banner;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * The homepage's hero feed — what the storefront actually calls.
 *
 * The rules here are the difference between a banner an operator uploaded
 * reaching a visitor and reaching nobody: a row whose file is missing is
 * dropped, and a row scoped to one game is not homepage copy.
 */
class StorefrontBannerTest extends TestCase
{
    use RefreshDatabase;

    private function banner(array $attributes = []): Banner
    {
        return Banner::create(array_merge([
            'category_id' => null,
            'name' => 'Promo',
            'image_path' => 'banners/images/promo.jpg',
            'link' => null,
        ], $attributes));
    }

    public function test_it_returns_a_global_banner_with_its_link(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('banners/images/promo.jpg', 'x');
        $banner = $this->banner(['link' => '/berita']);

        $this->getJson('/api/v1/storefront/banners')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $banner->id)
            ->assertJsonPath('data.0.link', '/berita')
            // The absolute URL a slide actually renders.
            ->assertJsonPath('data.0.image_url', Storage::disk('public')->url('banners/images/promo.jpg'));
    }

    public function test_it_drops_a_banner_whose_image_file_is_missing(): void
    {
        Storage::fake('public');
        // The row exists and the file never did — exactly how the seeded
        // banners failed, silently, for every visitor.
        $this->banner();

        $this->getJson('/api/v1/storefront/banners')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_the_homepage_feed_leaves_out_banners_scoped_to_a_game(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('banners/images/global.jpg', 'x');
        Storage::disk('public')->put('banners/images/game.jpg', 'x');

        $category = Category::factory()->create();
        $this->banner(['name' => 'Homepage', 'image_path' => 'banners/images/global.jpg']);
        $this->banner([
            'name' => 'Mobile Legends only',
            'image_path' => 'banners/images/game.jpg',
            'category_id' => $category->id,
        ]);

        $this->getJson('/api/v1/storefront/banners')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Homepage');
    }

    public function test_a_scoped_request_still_gets_that_categorys_banners(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('banners/images/game.jpg', 'x');

        $category = Category::factory()->create();
        $this->banner([
            'name' => 'Mobile Legends only',
            'image_path' => 'banners/images/game.jpg',
            'category_id' => $category->id,
        ]);

        $this->getJson('/api/v1/storefront/banners?category_id='.$category->id)
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Mobile Legends only');
    }
}
