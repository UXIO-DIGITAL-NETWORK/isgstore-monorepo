<?php

namespace App\Http\Resources\Api\Product;

use App\Http\Resources\Api\Category\CategoryResource;
use App\Http\Resources\Api\Category\SubCategory\SubCategoryResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
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
            'sub_category_id' => $this->sub_category_id,
            'name' => $this->name,
            'code' => $this->code,
            'price_modal' => $this->price_modal,
            'price_member' => $this->price_member,
            'price_vip' => $this->price_vip,
            'price_reseller' => $this->price_reseller,
            'price_agent' => $this->price_agent,
            'status' => (bool) $this->status,
            'category' => new CategoryResource($this->whenLoaded('category')),
            'sub_category' => new SubCategoryResource($this->whenLoaded('subCategory')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
