<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Services\ImageOptimizer;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Images are stored as WebP, and everything that cannot be faithfully
 * converted is stored exactly as it arrived.
 *
 * The passthrough cases matter more than the conversion ones: converting a
 * favicon, a vector logo, or a customer's payment proof is a data-loss bug
 * that only surfaces long after the upload. The end-to-end wiring is covered
 * by Tests\Feature\ImageUploadWebpTest.
 */
class ImageOptimizerTest extends TestCase
{
    private ImageOptimizer $optimizer;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
        $this->optimizer = app(ImageOptimizer::class);
    }

    // ── Conversion ───────────────────────────────────────────────────────────

    public function test_a_jpeg_is_stored_as_webp(): void
    {
        $path = $this->optimizer->store(UploadedFile::fake()->image('logo.jpg', 400, 300), 'categories/logos');

        $this->assertStringEndsWith('.webp', $path);
        $this->assertTrue($this->isWebp(Storage::disk('public')->get($path)));
    }

    public function test_an_oversized_image_is_capped_on_its_longest_edge(): void
    {
        $path = $this->optimizer->store(UploadedFile::fake()->image('banner.jpg', 3000, 2000), 'banners/images');

        [$width, $height] = $this->dimensions($path);

        $this->assertSame(1920, $width);
        // Aspect ratio preserved: 2000 * (1920 / 3000) = 1280.
        $this->assertSame(1280, $height);
    }

    public function test_a_portrait_image_is_capped_on_its_height(): void
    {
        $path = $this->optimizer->store(UploadedFile::fake()->image('tall.jpg', 1000, 4000), 'articles/images');

        $this->assertSame([480, 1920], $this->dimensions($path));
    }

    public function test_a_small_image_is_never_upscaled(): void
    {
        $path = $this->optimizer->store(UploadedFile::fake()->image('icon.png', 64, 64), 'products/logos');

        $this->assertSame([64, 64], $this->dimensions($path));
    }

    public function test_transparency_survives_the_conversion(): void
    {
        $source = imagecreatetruecolor(40, 40);
        imagesavealpha($source, true);
        imagefill($source, 0, 0, imagecolorallocatealpha($source, 0, 0, 0, 127));

        ob_start();
        imagepng($source);
        $png = (string) ob_get_clean();
        imagedestroy($source);

        $path = $this->optimizer->store(
            UploadedFile::fake()->createWithContent('transparent.png', $png),
            'testimonials/avatars',
        );

        $converted = imagecreatefromstring(Storage::disk('public')->get($path));
        $alpha = (imagecolorat($converted, 0, 0) >> 24) & 0x7F;
        imagedestroy($converted);

        $this->assertSame(127, $alpha, 'The fully transparent pixel came back opaque.');
    }

    public function test_the_stored_file_is_smaller_than_the_original(): void
    {
        $file = UploadedFile::fake()->image('photo.jpg', 2400, 1600);
        $originalBytes = filesize($file->getRealPath());

        $path = $this->optimizer->store($file, 'articles/images');

        $this->assertLessThan($originalBytes, strlen(Storage::disk('public')->get($path)));
    }

    // ── Passthrough ──────────────────────────────────────────────────────────

    public function test_an_svg_is_stored_untouched(): void
    {
        $svg = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>';

        $path = $this->optimizer->store(UploadedFile::fake()->createWithContent('logo.svg', $svg), 'settings');

        $this->assertStringEndsWith('.svg', $path);
        $this->assertSame($svg, Storage::disk('public')->get($path));
    }

    public function test_an_ico_is_stored_untouched(): void
    {
        $path = $this->optimizer->store(UploadedFile::fake()->create('favicon.ico', 2), 'settings');

        $this->assertStringEndsWith('.ico', $path);
    }

    public function test_a_pdf_is_stored_untouched(): void
    {
        $path = $this->optimizer->store(UploadedFile::fake()->create('invoice.pdf', 8), 'withdrawals/proofs');

        $this->assertStringEndsWith('.pdf', $path);
    }

    public function test_an_animated_gif_keeps_its_frames(): void
    {
        $path = $this->optimizer->store(
            UploadedFile::fake()->createWithContent('spinner.gif', $this->animatedGif()),
            'banners/images',
        );

        $this->assertStringEndsWith('.gif', $path);
        $this->assertSame($this->animatedGif(), Storage::disk('public')->get($path));
    }

    public function test_a_webp_within_the_size_limit_is_not_re_encoded(): void
    {
        $source = imagecreatetruecolor(200, 150);
        ob_start();
        imagewebp($source, null, 90);
        $webp = (string) ob_get_clean();
        imagedestroy($source);

        $path = $this->optimizer->store(UploadedFile::fake()->createWithContent('already.webp', $webp), 'products/logos');

        $this->assertSame($webp, Storage::disk('public')->get($path), 'A WebP was needlessly re-encoded.');
    }

    public function test_an_oversized_webp_is_still_downscaled(): void
    {
        $source = imagecreatetruecolor(2400, 1200);
        ob_start();
        imagewebp($source, null, 90);
        $webp = (string) ob_get_clean();
        imagedestroy($source);

        $path = $this->optimizer->store(UploadedFile::fake()->createWithContent('huge.webp', $webp), 'banners/images');

        $this->assertSame([1920, 960], $this->dimensions($path));
    }

    public function test_conversion_can_be_switched_off(): void
    {
        config(['images.enabled' => false]);

        $path = $this->optimizer->store(UploadedFile::fake()->image('logo.jpg'), 'categories/logos');

        $this->assertStringEndsWith('.jpg', $path);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private function isWebp(string $binary): bool
    {
        return str_starts_with($binary, 'RIFF') && substr($binary, 8, 4) === 'WEBP';
    }

    /** @return array{0: int, 1: int} */
    private function dimensions(string $path): array
    {
        $image = imagecreatefromstring(Storage::disk('public')->get($path));
        $size = [imagesx($image), imagesy($image)];
        imagedestroy($image);

        return $size;
    }

    /** A hand-built 1x1 GIF89a with two Graphic Control Extension blocks. */
    private function animatedGif(): string
    {
        $frame = "\x21\xF9\x04\x00\x0A\x00\x00\x00"
            ."\x2C\x00\x00\x00\x00\x01\x00\x01\x00\x00"
            ."\x02\x02\x4C\x01\x00";

        return 'GIF89a'."\x01\x00\x01\x00\x80\x00\x00"."\x00\x00\x00\xFF\xFF\xFF".$frame.$frame."\x3B";
    }
}
