<?php

namespace App\Http\Resources\Api\Service;

use App\Models\ServiceInvoice;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ServiceInvoice */
class ServiceInvoiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'invoice_number' => $this->invoice_number,
            'service' => $this->whenLoaded('service', fn () => [
                'id' => $this->service->id,
                'code' => $this->service->code,
                'name' => $this->service->name,
            ]),
            // Only present for the payment-internal view, which eager-loads it.
            'merchant' => $this->whenLoaded('merchant', fn () => [
                'id' => $this->merchant->id,
                'name' => $this->merchant->name,
                'email' => $this->merchant->email,
            ]),
            'service_name' => $this->service_name,
            'amount' => (int) $this->amount,
            'duration_days' => (int) $this->duration_days,
            'status' => $this->status?->value,
            'due_at' => $this->due_at?->toIso8601String(),
            'notes' => $this->notes,
            // The gateway attempt the client is looking at. Null until one is
            // opened, and carried on the row so the invoice page needs no
            // second request to know what to pay against.
            'payment' => $this->whenLoaded('latestPayment', fn () => $this->latestPayment ? [
                'channel' => $this->latestPayment->paymentChannel?->name,
                'channel_code' => $this->latestPayment->paymentChannel?->channel_code,
                'type' => $this->latestPayment->paymentChannel?->payment_type,
                'amount' => (int) $this->latestPayment->amount,
                'admin_fee' => (int) $this->latestPayment->admin_fee,
                'total' => (int) $this->latestPayment->total,
                'status' => $this->latestPayment->status,
                // Server-declared, never re-derived on the client — the same
                // window PaymentExpiry gives the storefront invoice page.
                'expires_at' => $this->latestPayment->expiresAt()?->toIso8601String(),
                'is_expired' => $this->latestPayment->status === 'PENDING' && $this->latestPayment->isExpired(),
                'instructions' => $this->latestPayment->payment_data ?: null,
            ] : null),
            'verified_at' => $this->verified_at?->toIso8601String(),
            'subscription' => $this->whenLoaded('subscription', fn () => $this->subscription ? [
                'id' => $this->subscription->id,
                'starts_at' => $this->subscription->starts_at?->toIso8601String(),
                'ends_at' => $this->subscription->ends_at?->toIso8601String(),
                'status' => $this->subscription->status?->value,
            ] : null),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
