<?php

namespace App\Http\Resources\Api\Service;

use App\Models\ServiceSubscription;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ServiceSubscription */
class ServiceSubscriptionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'service' => $this->whenLoaded('service', fn () => [
                'id' => $this->service->id,
                'code' => $this->service->code,
                'name' => $this->service->name,
                'category' => $this->service->category?->value,
            ]),
            'merchant' => $this->whenLoaded('merchant', fn () => [
                'id' => $this->merchant->id,
                'name' => $this->merchant->name,
            ]),
            'starts_at' => $this->starts_at?->toIso8601String(),
            'ends_at' => $this->ends_at?->toIso8601String(),
            // Whole days left; never negative, so an expired row reads 0 rather
            // than a misleading "-3 hari".
            'days_remaining' => $this->ends_at
                ? max(0, (int) ceil(now()->floatDiffInDays($this->ends_at, false)))
                : 0,
            'status' => $this->status?->value,
            'invoice_number' => $this->whenLoaded('invoice', fn () => $this->invoice?->invoice_number),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
