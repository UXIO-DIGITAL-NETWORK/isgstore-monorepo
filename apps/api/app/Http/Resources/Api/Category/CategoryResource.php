<?php

namespace App\Http\Resources\Api\Category;

use App\Http\Resources\Api\Category\CategoryType\CategoryTypeResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class CategoryResource extends JsonResource
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
            'type_id' => $this->type_id,
            'name' => $this->name,
            'sub_name' => $this->sub_name,
            'code' => $this->code,
            'slug' => $this->slug,
            'uid_parser' => $this->uid_parser,
            'validasi_nickname' => $this->validasi_nickname,
            'region' => $this->region,
            'logo' => $this->logo,
            'logo_url' => $this->logo ? Storage::disk('public')->url($this->logo) : null,
            'description' => $this->description,
            'status' => (bool) $this->status,
            'order_form_fields' => $this->order_form_fields ?? [],
            'meta_title' => $this->meta_title,
            'meta_description' => $this->meta_description,
            'og_image' => $this->og_image,
            'og_image_url' => $this->og_image ? Storage::disk('public')->url($this->og_image) : null,
            'meta_keywords' => $this->meta_keywords ?? [],
            'meta_robots' => $this->meta_robots,

            // ROOT CAUSE FIX: Gunakan pengondisian deklaratif bawaan API Resource
            'type' => new CategoryTypeResource($this->whenLoaded('categoryType')),

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
