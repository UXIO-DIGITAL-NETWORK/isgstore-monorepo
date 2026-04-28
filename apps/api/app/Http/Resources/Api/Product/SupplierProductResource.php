<?php

namespace App\Http\Resources\Api\Product;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\Api\Supplier\SupplierResource;

class SupplierProductResource extends JsonResource
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
            'product_id' => $this->product_id,
            'supplier_id' => $this->supplier_id,
            'buyer_sku_code' => $this->buyer_sku_code,
            'price' => $this->price,
            'buyer_product_status' => (bool) $this->buyer_product_status,
            'seller_product_status' => (bool) $this->seller_product_status,
            'is_active' => (bool) $this->is_active,
            'product' => new ProductResource($this->whenLoaded('product')),
            'supplier' => new SupplierResource($this->whenLoaded('supplier')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
