<?php

namespace App\Http\Resources\Api\Product;

use App\Http\Resources\Api\Supplier\SupplierResource;
use App\Services\ProductRepricer;
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
            'pool_category_id' => $this->pool_category_id,
            'buyer_sku_code' => $this->buyer_sku_code,
            'provider_name' => $this->provider_name,
            'price' => $this->price,
            'buyer_product_status' => (bool) $this->buyer_product_status,
            'seller_product_status' => (bool) $this->seller_product_status,
            'is_active' => (bool) $this->is_active,
            'is_price_locked' => (bool) $this->is_price_locked,
            // Convenience mirror of the supplier flag so the table can protect
            // System rows without eager-reading the relationship every render.
            'is_system' => (bool) ($this->relationLoaded('supplier') && $this->supplier?->is_system),
            // The margins an admin actually authored, keyed by membership plan.
            // Read from `supplier_product_margins` (attached per page by
            // GetSupplierProductsAction), not from the frozen `margin_*`
            // columns — nothing has written those since pricing moved to plans,
            // so a saved margin used to read back as null everywhere.
            'plan_margins' => $this->whenNotNull($this->authored_plan_margins),
            // Legacy role-keyed mirror, kept for one release for the provider
            // table. Derived from the same authored margins rather than the
            // dead columns.
            'margins' => $this->legacyMargins(),
            'price_min' => $this->price_min,
            'price_max' => $this->price_max,
            // The day's selling allowance (null = no ceiling) and what is left of
            // it — the latter attached per page by `GetSupplierProductsAction`,
            // which is where the one count for the whole page happens.
            'daily_order_limit' => $this->daily_order_limit === null ? null : (int) $this->daily_order_limit,
            'stock_left_today' => $this->stock_left_today === null ? null : (int) $this->stock_left_today,
            'margin_set_at' => $this->margin_set_at,
            // Where this row sits in the pipeline, plus the promote gate. Both come
            // from the model so the admin's badge and the API's 422 can never
            // disagree about whether a SKU is promotable.
            'pool_state' => $this->poolState(),
            'can_promote' => $this->canPromote(),
            'promote_blocked_reason' => $this->promoteBlockedReason(),
            // Projected selling prices for a pooled row, which has no product to
            // read real ones from. Attached per page by GetSupplierProductsAction.
            //
            // One entry per active membership plan, carrying its label: the
            // admin prices a SKU per plan, so previewing four fixed tiers could
            // never show what a plan they created would sell at.
            'preview_plan_prices' => $this->whenNotNull($this->preview_plan_prices),
            'point_percent' => $this->point_percent !== null ? (float) $this->point_percent : null,
            'point_flat' => $this->point_flat !== null ? (int) $this->point_flat : null,
            'product_status' => $this->whenLoaded('product', fn () => (bool) $this->product?->status),
            'published_at' => $this->whenLoaded('product', fn () => $this->product?->published_at),
            'pool_category' => $this->whenLoaded('poolCategory', fn () => $this->poolCategory ? [
                'id' => $this->poolCategory->id,
                'name' => $this->poolCategory->name,
            ] : null),
            'product' => new ProductResource($this->whenLoaded('product')),
            'supplier' => new SupplierResource($this->whenLoaded('supplier')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    /**
     * The authored margins expressed in the legacy role vocabulary.
     *
     * @return array<string,float|null>
     */
    private function legacyMargins(): array
    {
        $authored = collect($this->authored_plan_margins ?? [])
            ->pluck('margin_percent', 'membership_plan_id');

        $margins = [];

        foreach (ProductRepricer::planIdByRole() as $role => $planId) {
            $margin = $authored[$planId] ?? null;
            $margins[$role] = $margin !== null ? (float) $margin : null;
        }

        return $margins;
    }
}
