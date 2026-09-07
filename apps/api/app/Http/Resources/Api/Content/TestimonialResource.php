<?php

namespace App\Http\Resources\Api\Content;

use App\Support\Storefront\MediaUrl;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TestimonialResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'author_name' => $this->author_name,
            'author_title' => $this->author_title,
            'avatar_path' => $this->avatar_path,
            'avatar_url' => MediaUrl::for($this->avatar_path),
            'content' => $this->content,
            'rating' => $this->rating !== null ? (int) $this->rating : null,
            'game_name' => $this->game_name,
            'is_featured' => (bool) $this->is_featured,
            'sort_order' => $this->sort_order,
            'is_active' => (bool) $this->is_active,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
