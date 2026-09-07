<?php

namespace App\Http\Resources\Api\Service;

use App\Enums\RoleType;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Service */
class ServiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'category' => $this->category?->value,
            'category_label' => $this->category?->label(),
            'description' => $this->description,
            'features' => $this->features ?? [],
            'selling_price' => (int) $this->selling_price,
            // What a service costs kita is an internal number. This resource is
            // also what MerchantServiceController serves to a client, so the key
            // is present only for the payment-internal role — the same role-name
            // match EnsureUserIsPaymentInternal makes.
            'cost_price' => $this->when(
                strtolower((string) $request->user()?->role?->name) === RoleType::PAYMENT_INTERNAL->value,
                fn () => (int) $this->cost_price,
            ),
            'duration_days' => (int) $this->duration_days,
            'payment_channel' => $this->whenLoaded('paymentChannel', fn () => $this->paymentChannel ? [
                'id' => $this->paymentChannel->id,
                'name' => $this->paymentChannel->name,
            ] : null),
            'is_active' => (bool) $this->is_active,
            'sort_order' => (int) $this->sort_order,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
