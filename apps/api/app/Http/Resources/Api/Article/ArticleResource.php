<?php

namespace App\Http\Resources\Api\Article;

use App\Support\Storefront\MediaUrl;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Admin projection — every column, including drafts and view counts.
 * The storefront gets its own narrower resources.
 */
class ArticleResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'article_category_id' => $this->article_category_id,
            'category_label' => $this->category_label,
            'type' => $this->type,
            'locale' => $this->locale,
            'title' => $this->title,
            'slug' => $this->slug,
            'excerpt' => $this->excerpt,
            'author_name' => $this->author_name,
            'body_sections' => $this->body_sections ?? [],
            'image_path' => $this->image_path,
            'image_url' => MediaUrl::for($this->image_path),
            'is_published' => (bool) $this->is_published,
            'is_featured' => (bool) $this->is_featured,
            'published_at' => $this->published_at,
            'view_count' => (int) $this->view_count,
            'meta_title' => $this->meta_title,
            'meta_description' => $this->meta_description,
            'meta_keywords' => $this->meta_keywords ?? [],
            'meta_robots' => $this->meta_robots,
            'category' => new ArticleCategoryResource($this->whenLoaded('articleCategory')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
