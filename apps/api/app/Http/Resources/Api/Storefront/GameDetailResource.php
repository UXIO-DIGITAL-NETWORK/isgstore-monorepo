<?php

namespace App\Http\Resources\Api\Storefront;

use App\Support\Storefront\MediaUrl;
use App\Support\Storefront\OrderFormFields;
use Illuminate\Http\Request;

/**
 * GameResource plus everything the checkout page needs to render:
 * the description, the SEO block, and the identity fields to ask for.
 */
class GameDetailResource extends GameResource
{
    public function toArray(Request $request): array
    {
        return parent::toArray($request) + [
            'description' => $this->description,

            // Drives the "Account Detail" step. Field #1 maps to target_uid and
            // field #2 to target_server — checkout accepts nothing else.
            'order_form_fields' => OrderFormFields::for($this->resource),

            'meta' => [
                'title' => $this->meta_title,
                'description' => $this->meta_description,
                'keywords' => $this->meta_keywords ?? [],
                'robots' => $this->meta_robots,
                'og_image_url' => MediaUrl::for($this->og_image),
            ],
        ];
    }
}
