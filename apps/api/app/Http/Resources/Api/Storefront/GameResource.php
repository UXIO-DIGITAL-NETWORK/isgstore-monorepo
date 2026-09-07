<?php

namespace App\Http\Resources\Api\Storefront;

use App\Support\Storefront\Catalog;
use App\Support\Storefront\MediaUrl;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A game as the public storefront sees it.
 *
 * Deliberately narrower than the admin CategoryResource: no internal `code`
 * beyond what the URL needs, no timestamps, no admin-only flags.
 */
class GameResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'sub_name' => $this->sub_name,
            // Publisher / server region shown under the game name on cards.
            'region' => $this->region,
            // Falls back to `code` so a game with no slug is still linkable.
            'slug' => $this->slug ?: $this->code,
            'code' => $this->code,
            'logo_url' => MediaUrl::for($this->logo),
            'thumbnail_url' => MediaUrl::for($this->thumbnail),
            'banner_url' => MediaUrl::for($this->banner),
            'initials' => Catalog::initials((string) $this->name),
            'category_type' => $this->whenLoaded('categoryType', fn () => [
                'id' => $this->categoryType->id,
                'name' => $this->categoryType->name,
            ]),
        ];
    }
}
