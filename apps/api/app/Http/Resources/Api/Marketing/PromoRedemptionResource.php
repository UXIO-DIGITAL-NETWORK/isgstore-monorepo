<?php

namespace App\Http\Resources\Api\Marketing;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PromoRedemptionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'promo_id' => $this->promo_id,
            'code_used' => $this->code_used,
            'discount_amount' => (int) $this->discount_amount,
            'user' => $this->whenLoaded('user'),
            'invoice_number' => $this->transaction?->invoice_number,
            'created_at' => $this->created_at,
        ];
    }
}
