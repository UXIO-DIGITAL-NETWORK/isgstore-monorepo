<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Role;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Uploading the site logo, including as an animated GIF.
 *
 * The heavy lifting already existed — `ImageOptimizer` refuses to re-encode an
 * animated GIF because GD cannot write animated WebP and converting would
 * silently keep one frame. What was missing was permission: the `mimes:` list
 * excluded gif, and the 2 MB ceiling meant for compressible rasters would have
 * rejected every real animated logo, since that file is precisely the one that
 * reaches disk uncompressed.
 */
class SettingLogoUploadTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');

        $role = Role::factory()->create(['name' => 'Admin']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]), ['access-api']);
    }

    private function setting(string $key): Setting
    {
        return Setting::create([
            'group' => 'general',
            'key' => $key,
            'value' => null,
            'type' => 'image',
            'label' => ucfirst($key),
            'is_public' => true,
        ]);
    }

    /** A hand-built 1x1 GIF89a carrying two Graphic Control Extension blocks. */
    private function animatedGif(): string
    {
        $frame = "\x21\xF9\x04\x00\x00\x00\x00\x00"
            ."\x2C\x00\x00\x00\x00\x01\x00\x01\x00\x00"
            ."\x02\x02\x44\x01\x00";

        return 'GIF89a'."\x01\x00\x01\x00\x80\x00\x00"."\x00\x00\x00\xFF\xFF\xFF".$frame.$frame."\x3B";
    }

    public function test_an_animated_gif_logo_is_stored_frame_for_frame(): void
    {
        $this->setting('logo');
        $bytes = $this->animatedGif();

        $this->postJson('/api/v1/settings/upload', [
            'key' => 'logo',
            'file' => UploadedFile::fake()->createWithContent('brand.gif', $bytes),
        ])->assertOk();

        $path = Setting::where('key', 'logo')->value('value');

        $this->assertStringEndsWith('.gif', $path, 'An animated logo must not be flattened to WebP.');
        $this->assertSame($bytes, Storage::disk('public')->get($path));
    }

    public function test_a_large_animated_gif_is_accepted(): void
    {
        // The file that skips compression is the one most likely to be big.
        // A 2 MB ceiling would have rejected every animated logo worth having.
        $this->setting('logo');

        $this->postJson('/api/v1/settings/upload', [
            'key' => 'logo',
            'file' => UploadedFile::fake()->createWithContent('brand.gif', $this->animatedGif())->size(3072),
        ])->assertOk();
    }

    public function test_a_gif_beyond_the_ceiling_is_still_refused(): void
    {
        $this->setting('logo');

        $this->postJson('/api/v1/settings/upload', [
            'key' => 'logo',
            'file' => UploadedFile::fake()->createWithContent('brand.gif', $this->animatedGif())->size(6144),
        ])->assertUnprocessable();
    }

    public function test_a_gif_is_refused_for_the_favicon(): void
    {
        // Scoped per setting: a GIF favicon behaves unpredictably across
        // browsers, and no link-preview scraper animates an OG image.
        $this->setting('favicon');

        $this->postJson('/api/v1/settings/upload', [
            'key' => 'favicon',
            'file' => UploadedFile::fake()->createWithContent('brand.gif', $this->animatedGif()),
        ])->assertUnprocessable();
    }

    public function test_a_png_logo_is_still_converted_to_webp(): void
    {
        $this->setting('logo');

        $this->postJson('/api/v1/settings/upload', [
            'key' => 'logo',
            'file' => UploadedFile::fake()->image('brand.png', 64, 64),
        ])->assertOk();

        $this->assertStringEndsWith('.webp', Setting::where('key', 'logo')->value('value'));
    }
}
