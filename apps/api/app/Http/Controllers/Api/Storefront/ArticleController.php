<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\Article\ArticleCategoryResource;
use App\Http\Resources\Api\Storefront\ArticleDetailResource;
use App\Http\Resources\Api\Storefront\ArticleListResource;
use App\Models\Article;
use App\Models\ArticleCategory;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Public, read-only article surface.
 *
 * Separate from the admin controller so the projection can stay narrow and
 * cannot inherit admin fields, and so "published" is enforced in one place
 * rather than depending on every caller remembering to filter.
 */
class ArticleController extends Controller
{
    use ApiResponse;

    private const RELATED_LIMIT = 3;

    public function index(Request $request): JsonResponse
    {
        $perPage = min(50, max(1, (int) $request->query('per_page', 9)));
        $categoryKey = $request->query('category');
        $search = $request->query('search');

        $articles = Article::query()
            ->with('articleCategory')
            ->where('is_published', true)
            ->where('locale', $request->query('locale', 'id'))
            ->when($request->query('type'), fn ($q, $type) => $q->where('type', $type))
            // Filtered by the category's stable key, not its id: the
            // storefront's pills are keyed on it and the URL carries it.
            ->when(
                $categoryKey && $categoryKey !== 'semua',
                fn ($q) => $q->whereHas('articleCategory', fn ($c) => $c->where('key', $categoryKey))
            )
            ->when($search, fn ($q) => $q->where('title', 'like', "%{$search}%"))
            ->when($request->boolean('featured'), fn ($q) => $q->where('is_featured', true))
            ->latest('published_at')
            ->latest('id')
            ->paginate($perPage);

        return $this->paginatedResponse(ArticleListResource::collection($articles), 'Articles retrieved successfully');
    }

    public function show(Request $request, string $slug): JsonResponse
    {
        $article = Article::query()
            ->with('articleCategory')
            ->where('slug', $slug)
            ->where('locale', $request->query('locale', 'id'))
            ->where('is_published', true)
            ->first();

        if (! $article) {
            return $this->errorResponse('Article not found', 404);
        }

        // Counted without touching `updated_at` — a read is not an edit, and
        // bumping it would reorder any admin list sorted by last change.
        $article->incrementQuietly('view_count');

        // Resolved here rather than on the client: finding three related
        // articles by downloading every article would not scale past a page.
        $related = Article::query()
            ->with('articleCategory')
            ->where('is_published', true)
            ->where('locale', $article->locale)
            ->where('article_category_id', $article->article_category_id)
            ->whereKeyNot($article->id)
            ->latest('published_at')
            ->limit(self::RELATED_LIMIT)
            ->get();

        return $this->successResponse([
            'article' => new ArticleDetailResource($article),
            'related' => ArticleListResource::collection($related),
        ], 'Article retrieved successfully');
    }

    public function categories(): JsonResponse
    {
        $categories = ArticleCategory::query()
            ->where('status', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return $this->successResponse(
            ArticleCategoryResource::collection($categories),
            'Article categories retrieved successfully'
        );
    }
}
