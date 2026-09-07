<?php

namespace App\Http\Resources\Api\Payment;

use App\Support\Storefront\MediaUrl;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentChannelResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'payment_type' => $this->payment_type,
            'channel_code' => $this->channel_code,
            'name' => $this->name,
            'logo_path' => $this->logo_path,
            'logo_url' => MediaUrl::for($this->logo_path),
            'description' => $this->description,
            'min_amount' => (int) $this->min_amount,
            'fee_flat' => (int) $this->fee_flat,
            'fee_percent' => (float) $this->fee_percent,
            'sort_order' => (int) $this->sort_order,
            'is_active' => (bool) $this->is_active,
            'is_single_use' => (bool) $this->is_single_use,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
