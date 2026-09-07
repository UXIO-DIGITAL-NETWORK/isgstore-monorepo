<?php

namespace App\Http\Resources\Api\Storefront;

use Illuminate\Http\Request;

/**
 * The list projection plus the body and SEO block. Extends the list resource
 * so the two can never drift on the fields they share.
 */
class ArticleDetailResource extends ArticleListResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return parent::toArray($request) + [
            'body_sections' => $this->body_sections ?? [],
            'meta' => [
                'title' => $this->meta_title ?? $this->title,
                'description' => $this->meta_description ?? $this->excerpt,
                'keywords' => $this->meta_keywords ?? [],
                'robots' => $this->meta_robots,
            ],
        ];
    }
}
