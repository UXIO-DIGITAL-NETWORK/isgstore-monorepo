<?php

namespace App\Http\Resources\Api\Announcement;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AnnouncementResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'category_id' => $this->category_id,
            'content' => $this->content,
            'image_path' => $this->image_path,
            'is_active' => (bool) $this->is_active,
            'scope' => $this->category_id ? 'targeted' : 'global',
            'category' => $this->whenLoaded('category'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
