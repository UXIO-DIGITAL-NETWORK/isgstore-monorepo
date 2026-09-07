<?php

namespace App\Actions\Article;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Article\ArticleCategoryDTO;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\ArticleCategory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

/**
 * One action for create and update — an article category is four scalar
 * fields with no upload and no side effects, so two near-identical classes
 * would be ceremony rather than clarity.
 */
class SaveArticleCategoryAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(ArticleCategoryDTO $dto, ?ArticleCategory $category = null): ArticleCategory
    {
        $attributes = [
            'name' => $dto->name,
            'sort_order' => $dto->sortOrder,
            'status' => $dto->status,
        ];

        // The key is the storefront's stable identifier. It is derived once on
        // create and then left alone: changing it would break every URL and
        // pill already pointing at this category.
        if ($category === null) {
            $attributes['key'] = $dto->key ?: Str::slug($dto->name);
            $category = ArticleCategory::create($attributes);
            $verb = 'created';
        } else {
            if ($dto->key) {
                $attributes['key'] = $dto->key;
            }
            $category->update($attributes);
            $verb = 'updated';
        }

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Admin {$verb} article category: {$dto->name}",
        ));

        return $category->fresh();
    }
}
