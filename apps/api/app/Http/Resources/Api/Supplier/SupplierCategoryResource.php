<?php

namespace App\Http\Resources\Api\Supplier;

use App\Http\Resources\Api\Category\CategoryResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SupplierCategoryResource extends JsonResource
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
            'supplier_id' => $this->supplier_id,
            'template_code' => $this->template_code,
            'category' => new CategoryResource($this->whenLoaded('category')),
            'supplier' => new SupplierResource($this->whenLoaded('supplier')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
