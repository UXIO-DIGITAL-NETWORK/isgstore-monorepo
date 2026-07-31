<?php

namespace App\Http\Resources\Api\Category\SubCategory;

use App\Http\Resources\Api\Category\CategoryResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class SubCategoryResource extends JsonResource
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
            'currency_name' => $this->currency_name,
            'description' => $this->description,
            'logo' => $this->logo,
            // Mirrors CategoryResource — the raw path alone is not renderable,
            // so a client would have to know the storage layout to show it.
            'logo_url' => $this->logo ? Storage::disk('public')->url($this->logo) : null,
            'status' => (bool) $this->status,
            'category' => new CategoryResource($this->whenLoaded('category')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
