<?php

namespace App\Http\Resources\Api\Service;

use App\Models\ServiceInvoice;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

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
            // Carried on every row rather than fetched separately: three static
            // strings are cheaper than a second request and a conditional.
            'transfer_instruction' => [
                'bank_name' => config('services.service_invoice.bank_name'),
                'account_number' => config('services.service_invoice.bank_account_number'),
                'account_holder' => config('services.service_invoice.bank_account_holder'),
                'note' => 'Transfer tepat sebesar nominal invoice, lalu unggah bukti transfer.',
            ],
            'proof_url' => $this->proof_path ? Storage::disk('public')->url($this->proof_path) : null,
            'proof_uploaded_at' => $this->proof_uploaded_at?->toIso8601String(),
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
