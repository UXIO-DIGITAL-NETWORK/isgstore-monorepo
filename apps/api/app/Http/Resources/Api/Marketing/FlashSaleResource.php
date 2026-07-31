<?php

namespace App\Http\Resources\Api\Marketing;

use App\Models\FlashSaleItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FlashSaleResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'starts_at' => $this->starts_at,
            'ends_at' => $this->ends_at,
            'is_active' => (bool) $this->is_active,
            // Whether it is *currently* running, which "is_active" alone does
            // not answer — an active sale can still be scheduled or expired.
            'is_running' => (bool) $this->is_active
                && $this->starts_at?->isPast()
                && $this->ends_at?->isFuture(),
            'items' => $this->whenLoaded('items', fn () => $this->items->map(fn (FlashSaleItem $item) => [
                'id' => $item->id,
                'product_id' => $item->product_id,
                'product_name' => $item->product?->name,
                'sale_price' => (int) $item->sale_price,
                'original_price' => (int) ($item->product?->price_member ?? 0),
                'stock_total' => (int) $item->stock_total,
                'stock_sold' => (int) $item->stock_sold,
                'stock_available' => $item->stockAvailable(),
                'sort_order' => (int) $item->sort_order,
            ])->values()),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
