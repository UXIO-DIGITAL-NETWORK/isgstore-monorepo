<?php

namespace App\Http\Resources\Api\Category\ServerCategory;

use App\Http\Resources\Api\Category\CategoryResource;
use App\Http\Resources\Api\Category\ServerCategoryOption\ServerCategoryOptionResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ServerCategoryResource extends JsonResource
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
            'name' => $this->name,
            'category' => new CategoryResource($this->whenLoaded('category')),
            // The admin edits a server and its options on one screen, so the
            // list has to carry them; `whenLoaded` keeps the shape honest for
            // any caller that did not eager-load.
            'options' => ServerCategoryOptionResource::collection($this->whenLoaded('options')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
