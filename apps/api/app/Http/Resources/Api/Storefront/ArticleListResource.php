<?php

namespace App\Http\Resources\Api\Storefront;

use App\Support\Storefront\MediaUrl;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Public article summary — built field by field rather than serialising the
 * model, so a future column cannot leak into the storefront by accident.
 * Drafts, view counts and the internal author id are deliberately absent.
 */
class ArticleListResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'type' => $this->type,
            'title' => $this->title,
            'excerpt' => $this->excerpt,
            'author' => $this->author_name,
            'image_url' => MediaUrl::for($this->image_path),
            'published_at' => $this->published_at,
            'is_featured' => (bool) $this->is_featured,
            'category' => [
                'key' => $this->articleCategory?->key,
                // The badge can differ from the pill it files under — see the
                // category_label migration.
                'name' => $this->category_label ?: $this->articleCategory?->name,
            ],
        ];
    }
}
