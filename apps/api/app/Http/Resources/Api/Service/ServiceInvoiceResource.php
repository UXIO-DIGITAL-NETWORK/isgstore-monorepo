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
                // THIS bill's own share, from the pivot — never the attempt's
                // columns, which are the batch's. Rendering `sip.total` here
                // would tell a client their Rp 500.000 bill cost Rp 5.000.000.
                'amount' => $this->shareOf('amount'),
                'admin_fee' => $this->shareOf('admin_fee'),
                'total' => $this->shareOf('amount') + $this->shareOf('admin_fee'),
                // The batch as a whole, so the page can say what was actually
                // charged and which other bills it covered.
                'batch' => (int) $this->latestPayment->invoice_count > 1 ? [
                    'reference_id' => $this->latestPayment->reference_id,
                    'invoice_count' => (int) $this->latestPayment->invoice_count,
                    'amount' => (int) $this->latestPayment->amount,
                    'admin_fee' => (int) $this->latestPayment->admin_fee,
                    'total' => (int) $this->latestPayment->total,
                ] : null,
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
            // Set on a bill this site issued because the Hub's plan said to,
            // rather than because a client clicked "Langganan".
            'source' => $this->source ?? 'local',
            // billed | one_time | prepaid. Null on rows issued before the column,
            // which were all `billed` — so the payment page can label a one-time
            // setup fee without a second request.
            'billing_mode' => $this->billing_mode ?? 'billed',
            'settled_offline' => (bool) $this->settled_offline,
            'period_starts_at' => $this->period_starts_at?->toIso8601String(),
            'period_ends_at' => $this->period_ends_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }

    /**
     * This bill's own figure on the settling attempt.
     *
     * Falls back to the attempt's column only when the pivot row is not loaded —
     * which for a single-invoice attempt is the same number anyway.
     */
    private function shareOf(string $column): int
    {
        $item = $this->latestPayment->items
            ->firstWhere('service_invoice_id', $this->id);

        return (int) ($item?->{$column} ?? $this->latestPayment->{$column});
    }
}
