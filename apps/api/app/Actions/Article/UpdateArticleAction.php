<?php

namespace App\Actions\Article;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Article\UpdateArticleDTO;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\Article;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class UpdateArticleAction
{
    public function __construct(private CreateActivityLogAction $activityLogAction) {}

    public function execute(Article $article, UpdateArticleDTO $dto): Article
    {
        // Keep the existing image when no new file is uploaded — an edit that
        // only fixes a typo must not blank the cover art.
        $imagePath = $article->image_path;

        if ($dto->imagePath instanceof UploadedFile) {
            if ($imagePath && Storage::disk('public')->exists($imagePath)) {
                Storage::disk('public')->delete($imagePath);
            }
            $imagePath = $dto->imagePath->store('articles/images', 'public');
        }

        $article->update([
            'article_category_id' => $dto->articleCategoryId,
            'category_label' => $dto->categoryLabel,
            'author_name' => $dto->authorName,
            'type' => $dto->type,
            'locale' => $dto->locale,
            'title' => $dto->title,
            'slug' => ArticleSlug::make($dto->slug ?: $dto->title, $dto->locale, $article->id),
            'excerpt' => $dto->excerpt,
            'body_sections' => $dto->bodySections ?? [],
            'image_path' => $imagePath,
            'is_published' => $dto->isPublished,
            'is_featured' => $dto->isFeatured,
            // Stamp the first publish, but never move an existing date — the
            // published date is a fact about the article, not about this edit.
            'published_at' => $dto->publishedAt ?? $article->published_at ?? ($dto->isPublished ? now() : null),
            'meta_title' => $dto->metaTitle,
            'meta_description' => $dto->metaDescription,
            'meta_keywords' => $dto->metaKeywords ?? [],
            'meta_robots' => $dto->metaRobots,
        ]);

        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Admin updated {$dto->type}: {$dto->title}",
        ));

        return $article->fresh(['articleCategory']);
    }
}
