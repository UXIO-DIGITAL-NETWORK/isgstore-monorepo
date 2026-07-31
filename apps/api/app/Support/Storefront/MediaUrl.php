<?php

declare(strict_types=1);

namespace App\Support\Storefront;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Public URL for an uploaded asset, or null.
 *
 * Returns null — never a URL — when the file is missing or `storage:link` was
 * never run, so the storefront can fall back to its bundled placeholder
 * instead of rendering a broken image.
 */
final class MediaUrl
{
    public static function for(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        // Already absolute (seed data and imports sometimes store full URLs).
        if (Str::startsWith($path, ['http://', 'https://'])) {
            return $path;
        }

        return Storage::disk('public')->exists($path)
            ? Storage::disk('public')->url($path)
            : null;
    }
}
