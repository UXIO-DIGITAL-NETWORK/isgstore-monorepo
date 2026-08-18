<?php

declare(strict_types=1);

namespace App\Services;

use GdImage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Throwable;

/**
 * Stores an uploaded image as WebP.
 *
 * This is the single place that decides how an image reaches disk. It replaced
 * the `$file->store($dir, 'public')` idiom that was duplicated across every
 * upload action — do not reintroduce that expression for an image anywhere.
 *
 * `store()` is a drop-in replacement: it returns the same relative path, so
 * the database columns, MediaUrl::for(), and the delete-the-old-file logic all
 * keep working unchanged.
 *
 * Anything it cannot faithfully convert is stored byte-for-byte instead:
 *
 *   - not a raster image at all  → SVG, ICO, PDF (getimagesize() rejects them)
 *   - an animated GIF            → GD cannot write animated WebP; converting
 *                                  one would silently keep a single frame
 *   - already WebP, small enough → re-encoding only costs generational quality
 *   - absurd pixel counts        → decoding would exhaust the PHP process
 *   - any failure whatsoever     → logged, then stored as uploaded
 *
 * That last rule is the important one: an upload must never fail because the
 * optimiser could not do its job.
 *
 * Payment proofs deliberately do NOT go through here — they are evidence, and
 * are kept exactly as the customer submitted them.
 */
class ImageOptimizer
{
    /**
     * Formats GD can decode and we are willing to re-encode.
     *
     * @var list<int>
     */
    private const CONVERTIBLE = [
        IMAGETYPE_JPEG,
        IMAGETYPE_PNG,
        IMAGETYPE_GIF,
        IMAGETYPE_BMP,
        IMAGETYPE_WEBP,
    ];

    /**
     * Store the upload and return its path relative to the disk root.
     */
    public function store(UploadedFile $file, string $directory, string $disk = 'public'): string
    {
        if (! config('images.enabled', true)) {
            return $file->store($directory, $disk);
        }

        try {
            $webp = $this->encode($file);
        } catch (Throwable $e) {
            Log::warning('Image optimisation failed; storing the original', [
                'file' => $file->getClientOriginalName(),
                'directory' => $directory,
                'error' => $e->getMessage(),
            ]);

            $webp = null;
        }

        if ($webp === null) {
            return $file->store($directory, $disk);
        }

        // Keep Laravel's random hashed filename — only the extension changes —
        // so nothing can be guessed from a URL and collisions stay impossible.
        $path = trim($directory, '/').'/'.pathinfo($file->hashName(), PATHINFO_FILENAME).'.webp';

        Storage::disk($disk)->put($path, $webp);

        return $path;
    }

    /**
     * The WebP bytes for this upload, or null when it must be stored as-is.
     */
    private function encode(UploadedFile $file): ?string
    {
        if (! function_exists('imagewebp')) {
            // GD built without WebP. Degrade to storing originals rather than
            // rejecting the upload — but say so, because it is a silent
            // environment problem otherwise.
            Log::warning('GD has no WebP support; images are stored unconverted');

            return null;
        }

        $path = $file->getRealPath();

        if ($path === false || ! is_readable($path)) {
            return null;
        }

        $info = @getimagesize($path);

        // false for SVG, ICO, PDF and anything else that is not a raster image.
        if ($info === false || ! in_array($info[2], self::CONVERTIBLE, true)) {
            return null;
        }

        [$width, $height] = $info;
        $type = $info[2];

        if ($width < 1 || $height < 1) {
            return null;
        }

        if ($width * $height > config('images.max_megapixels', 50) * 1_000_000) {
            return null;
        }

        $maxDimension = (int) config('images.max_dimension', 1920);

        if ($type === IMAGETYPE_GIF && $this->isAnimatedGif($path)) {
            return null;
        }

        if ($type === IMAGETYPE_WEBP && max($width, $height) <= $maxDimension) {
            return null;
        }

        $contents = file_get_contents($path);

        if ($contents === false) {
            return null;
        }

        $image = @imagecreatefromstring($contents);

        if (! $image instanceof GdImage) {
            return null;
        }

        try {
            $image = $this->applyExifOrientation($image, $type, $path);
            $image = $this->downscale($image, $maxDimension);

            // WebP carries alpha, so a transparent PNG logo stays transparent.
            imagealphablending($image, false);
            imagesavealpha($image, true);

            ob_start();
            $written = imagewebp($image, null, (int) config('images.quality', 82));
            $binary = (string) ob_get_clean();

            return $written && $binary !== '' ? $binary : null;
        } finally {
            imagedestroy($image);
        }
    }

    /**
     * Scale down so the longest edge fits `$maxDimension`. Never scales up.
     */
    private function downscale(GdImage $image, int $maxDimension): GdImage
    {
        $width = imagesx($image);
        $height = imagesy($image);
        $longest = max($width, $height);

        if ($maxDimension < 1 || $longest <= $maxDimension) {
            return $image;
        }

        $ratio = $maxDimension / $longest;
        $target = imagecreatetruecolor(
            max(1, (int) round($width * $ratio)),
            max(1, (int) round($height * $ratio)),
        );

        // Set before the copy: without this the resampled canvas composites
        // transparent pixels onto black.
        imagealphablending($target, false);
        imagesavealpha($target, true);

        imagecopyresampled(
            $target, $image,
            0, 0, 0, 0,
            imagesx($target), imagesy($target), $width, $height,
        );

        imagedestroy($image);

        return $target;
    }

    /**
     * Bake the JPEG EXIF orientation into the pixels — WebP does not carry the
     * tag, so a phone photo would otherwise come out rotated.
     */
    private function applyExifOrientation(GdImage $image, int $type, string $path): GdImage
    {
        if ($type !== IMAGETYPE_JPEG || ! function_exists('exif_read_data')) {
            return $image;
        }

        $exif = @exif_read_data($path);
        $orientation = (int) ($exif['Orientation'] ?? 0);

        $rotated = match ($orientation) {
            3 => imagerotate($image, 180, 0),
            6 => imagerotate($image, -90, 0),
            8 => imagerotate($image, 90, 0),
            default => null,
        };

        if (! $rotated instanceof GdImage) {
            return $image;
        }

        imagedestroy($image);

        return $rotated;
    }

    /**
     * More than one Graphic Control Extension block means more than one frame.
     *
     * The widely-copied version of this check also requires a leading null
     * byte, which misses the first GCE whenever it follows the global colour
     * table — a two-frame GIF then counts as one and is silently flattened.
     * A false positive here only means a static GIF is stored as a GIF, which
     * is the harmless direction to be wrong in.
     */
    private function isAnimatedGif(string $path): bool
    {
        $contents = file_get_contents($path);

        return $contents !== false && substr_count($contents, "\x21\xF9\x04") > 1;
    }
}
