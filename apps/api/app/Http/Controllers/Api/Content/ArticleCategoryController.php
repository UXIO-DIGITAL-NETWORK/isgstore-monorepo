<?php

namespace App\Http\Controllers\Api\Content;

use App\Actions\Article\SaveArticleCategoryAction;
use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\Article\StoreArticleCategoryRequest;
use App\Http\Requests\Article\UpdateArticleCategoryRequest;
use App\Http\Resources\Api\Article\ArticleCategoryResource;
use App\Models\ArticleCategory;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ArticleCategoryController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $perPage = min(100, max(1, (int) $request->query('per_page', 15)));
        $search = $request->query('search');

        $categories = ArticleCategory::query()
            ->when($search, fn ($q) => $q->where('name', 'like', "%{$search}%"))
            ->orderBy('sort_order')
            ->orderBy('name')
            ->paginate($perPage);

        return $this->paginatedResponse(
            ArticleCategoryResource::collection($categories),
            'Article categories retrieved successfully'
        );
    }

    public function store(StoreArticleCategoryRequest $request, SaveArticleCategoryAction $action)
    {
        $category = $action->execute($request->toDTO());

        return $this->successResponse(
            new ArticleCategoryResource($category),
            'Article category created successfully',
            201
        );
    }

    public function show(ArticleCategory $articleCategory)
    {
        return $this->successResponse(
            new ArticleCategoryResource($articleCategory),
            'Article category retrieved successfully'
        );
    }

    public function update(
        UpdateArticleCategoryRequest $request,
        ArticleCategory $articleCategory,
        SaveArticleCategoryAction $action
    ) {
        $category = $action->execute($request->toDTO(), $articleCategory);

        return $this->successResponse(new ArticleCategoryResource($category), 'Article category updated successfully');
    }

    public function destroy(ArticleCategory $articleCategory, CreateActivityLogAction $activityLogAction)
    {
        // Articles cascade with their category, so refuse rather than silently
        // taking published content offline with one click.
        if ($articleCategory->articles()->exists()) {
            return $this->errorResponse(
                'This category still has articles. Move or delete them first.',
                422
            );
        }

        $name = $articleCategory->name;
        $articleCategory->delete();

        $activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Admin deleted article category: {$name}",
        ));

        return $this->successResponse(null, 'Article category deleted successfully');
    }
}
