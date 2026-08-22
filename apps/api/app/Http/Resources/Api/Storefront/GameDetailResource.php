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

            // Whether the storefront should offer a "Cek Username" action. Two
            // conditions: the operator has enabled the check for this game (the
            // master switch), AND a provider is configured (a lookup URL or a paid
            // lookup URL) to actually resolve the name. Disabling keeps the
            // provider config so it can be turned back on without re-entry.
            'supports_nickname_check' => (bool) $this->nickname_check_enabled
                && trim((string) $this->validasi_nickname) !== '',

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
