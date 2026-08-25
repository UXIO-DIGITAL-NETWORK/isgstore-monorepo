<?php

namespace App\Http\Resources\Api\Product;

use App\Http\Resources\Api\Category\CategoryResource;
use App\Http\Resources\Api\Category\SubCategory\SubCategoryResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class ProductResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Defence in depth. Every caller should hand this a real product —
        // `Transaction::product()` is declared withTrashed precisely so an
        // archived one still resolves — but this class dereferences `$this->id`
        // straight through DelegatesToResource, so a null resource would fatal
        // the admin transaction list and the dashboard rather than render blank.
        if ($this->resource === null) {
            return [];
        }

        return [
            'id' => $this->id,
            'category_id' => $this->category_id,
            'sub_category_id' => $this->sub_category_id,
            'name' => $this->name,
            'sub_name' => $this->sub_name,
            'code' => $this->code,
            'logo' => $this->logo,
            'logo_url' => $this->logo ? Storage::disk('public')->url($this->logo) : null,
            'description' => $this->description,
            'validasi_nickname' => $this->validasi_nickname,
            'access' => $this->access,
            'tag' => $this->tag,
            'price_modal' => $this->price_modal,
            'price_member' => $this->price_member,
            'price_vip' => $this->price_vip,
            'price_reseller' => $this->price_reseller,
            'price_agent' => $this->price_agent,
            'status' => (bool) $this->status,
            // Where the product sits in its lifecycle, mirroring the pool's
            // `pool_state` / `can_promote` / `promote_blocked_reason` trio.
            // `status` alone cannot answer it: a product is only live when an
            // active supplier mapping backs it, which is the whole reason
            // "Activate" was replaced by Publish.
            //
            // Only emitted when the mappings are already loaded. All three read
            // that relation, and a transaction list embeds this resource per row
            // — computing them unconditionally would turn one page into an N+1.
            $this->mergeWhen($this->resource->relationLoaded('supplierProducts'), fn () => [
                'publish_state' => $this->publishState(),
                'can_publish' => $this->canPublish(),
                'publish_blocked_reason' => $this->publishBlockedReason(),
            ]),
            'published_at' => $this->published_at,
            'archived_at' => $this->deleted_at,
            'is_available' => (bool) $this->is_available,
            'is_price_locked' => (bool) $this->is_price_locked,
            'is_price_hidden' => (bool) $this->is_price_hidden,
            'price_min' => $this->price_min,
            'price_max' => $this->price_max,
            'category' => new CategoryResource($this->whenLoaded('category')),
            'sub_category' => new SubCategoryResource($this->whenLoaded('subCategory')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
