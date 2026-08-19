<?php

namespace App\Http\Resources\Api\Product;

use App\Http\Resources\Api\Supplier\SupplierResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

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
            'is_price_locked' => (bool) $this->is_price_locked,
            // Convenience mirror of the supplier flag so the table can protect
            // System rows without eager-reading the relationship every render.
            'is_system' => (bool) ($this->relationLoaded('supplier') && $this->supplier?->is_system),
            'margins' => [
                'member' => $this->margin_member !== null ? (float) $this->margin_member : null,
                'vip' => $this->margin_vip !== null ? (float) $this->margin_vip : null,
                'reseller' => $this->margin_reseller !== null ? (float) $this->margin_reseller : null,
                'agent' => $this->margin_agent !== null ? (float) $this->margin_agent : null,
            ],
            'product' => new ProductResource($this->whenLoaded('product')),
            'supplier' => new SupplierResource($this->whenLoaded('supplier')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
