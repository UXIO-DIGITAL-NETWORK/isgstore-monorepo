<?php

namespace App\Actions\Article;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Article\CreateArticleDTO;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\Article;
use App\Services\ImageOptimizer;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;

class CreateArticleAction
{
    public function __construct(
        private CreateActivityLogAction $activityLogAction,
        private ImageOptimizer $images,
    ) {}

    public function execute(CreateArticleDTO $dto): Article
    {
        $imagePath = null;

        if ($dto->imagePath instanceof UploadedFile) {
            $imagePath = $this->images->store($dto->imagePath, 'articles/images');
        }

        $article = Article::create([
            'article_category_id' => $dto->articleCategoryId,
            'category_label' => $dto->categoryLabel,
            'author_id' => Auth::id(),
            'author_name' => $dto->authorName,
            'type' => $dto->type,
            'locale' => $dto->locale,
            'title' => $dto->title,
            'slug' => ArticleSlug::make($dto->slug ?: $dto->title, $dto->locale),
            'excerpt' => $dto->excerpt,
            'body_sections' => $dto->bodySections ?? [],
            'image_path' => $imagePath,
            'is_published' => $dto->isPublished,
            'is_featured' => $dto->isFeatured,
            // A published article with no date would sort to the bottom of a
            // feed ordered by publication, so it defaults to now.
            'published_at' => $dto->publishedAt ?? ($dto->isPublished ? now() : null),
            'meta_title' => $dto->metaTitle,
            'meta_description' => $dto->metaDescription,
            'meta_keywords' => $dto->metaKeywords ?? [],
            'meta_robots' => $dto->metaRobots,
        ]);

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Admin created {$dto->type}: {$dto->title}",
        ));

        return $article->load('articleCategory');
    }
}
