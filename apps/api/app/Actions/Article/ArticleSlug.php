<?php

namespace App\Actions\Article;

use App\Models\Article;
use Illuminate\Support\Str;

/**
 * Builds a URL slug that is unique within its locale.
 *
 * The storefront routes articles by slug, so a collision would make one of the
 * two unreachable. Suffixing keeps the readable stem instead of falling back
 * to an id.
 */
final class ArticleSlug
{
    public static function make(string $source, string $locale, ?int $ignoreId = null): string
    {
        $base = Str::slug($source) ?: 'article';
        $slug = $base;
        $suffix = 2;

        while (self::taken($slug, $locale, $ignoreId)) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }

    private static function taken(string $slug, string $locale, ?int $ignoreId): bool
    {
        return Article::where('slug', $slug)
            ->where('locale', $locale)
            ->when($ignoreId, fn ($query) => $query->whereKeyNot($ignoreId))
            ->exists();
    }
}
