<?php

namespace App\Actions\Article;

use App\Models\Article;
use Illuminate\Pagination\LengthAwarePaginator;

class GetArticlesAction
{
    public function execute(
        int $perPage = 15,
        ?string $search = null,
        ?int $categoryId = null,
        ?string $type = null,
        ?string $locale = null,
        ?bool $published = null,
    ): LengthAwarePaginator {
        return Article::with(['articleCategory', 'author'])
            ->when($search, fn ($q) => $q->where(
                fn ($q) => $q->where('title', 'like', "%{$search}%")->orWhere('excerpt', 'like', "%{$search}%")
            ))
            ->when($categoryId, fn ($q) => $q->where('article_category_id', $categoryId))
            ->when($type, fn ($q) => $q->where('type', $type))
            ->when($locale, fn ($q) => $q->where('locale', $locale))
            // Explicit null check: `false` means "drafts only", which
            // `when($published, ...)` would silently discard.
            ->when($published !== null, fn ($q) => $q->where('is_published', $published))
            ->latest('published_at')
            ->latest('id')
            ->paginate($perPage);
    }
}
