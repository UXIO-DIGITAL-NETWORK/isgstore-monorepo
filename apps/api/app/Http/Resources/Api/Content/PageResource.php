<?php

namespace App\Http\Resources\Api\Content;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PageResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'locale' => $this->locale,
            'title' => $this->title,
            'intro' => $this->intro ?? [],
            'sections' => $this->sections ?? [],
            'is_published' => (bool) $this->is_published,
            'meta_title' => $this->meta_title,
            'meta_description' => $this->meta_description,
            'meta_robots' => $this->meta_robots,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
