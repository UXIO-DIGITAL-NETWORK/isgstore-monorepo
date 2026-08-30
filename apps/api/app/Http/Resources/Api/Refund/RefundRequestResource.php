<?php

namespace App\Http\Resources\Api\Refund;

use App\Support\Payout\BankCatalog;
use App\Support\Storefront\MediaUrl;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Admin-facing shape of a refund. Contact details and the payout account are
 * unmasked here on purpose — an admin has to read the account number to make
 * the transfer, and the route is behind `auth:sanctum` + `admin`.
 *
 * The public claim page has its own hand-built projection in
 * `ShowRefundClaimAction`; the two must never be merged.
 */
class RefundRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'refund_number' => $this->refund_number,
            'method' => $this->method?->value,
            'status' => $this->status?->value,
            'amount' => (int) $this->amount,

            'transaction' => [
                'id' => $this->transaction_id,
                'invoice_number' => $this->transaction?->invoice_number,
                'product' => $this->transaction?->product?->name,
                'created_at' => $this->transaction?->created_at?->toIso8601String(),
            ],

            'customer' => [
                // Null for guests — the contact fields below are the identity.
                'user_id' => $this->user_id,
                'name' => $this->user?->name,
                'email' => $this->contact_email,
                'phone' => $this->contact_phone,
                // Lets the queue flag rows nobody can reach automatically.
                'is_guest' => $this->user_id === null,
            ],

            'payout' => $this->bank_code ? [
                'bank_code' => $this->bank_code,
                'bank_name' => BankCatalog::name((string) $this->bank_code),
                'account_number' => $this->account_number,
                'account_name' => $this->account_name,
                'account_phone' => $this->account_phone,
                'submitted_at' => $this->payout_submitted_at?->toIso8601String(),
                'submitted_by' => $this->payout_submitted_by,
            ] : null,

            'claim_notified_at' => $this->claim_notified_at?->toIso8601String(),
            'processed_by' => $this->processedBy?->name,
            'processed_at' => $this->processed_at?->toIso8601String(),
            'proof_url' => MediaUrl::for($this->proof_path),
            'admin_note' => $this->admin_note,
            'reject_reason' => $this->reject_reason,
            'refunded_at' => $this->refunded_at?->toIso8601String(),
            'settlement_reversed_at' => $this->settlement_reversed_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
