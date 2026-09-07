<?php

namespace App\Http\Resources\Withdrawal;

use App\Models\Withdrawal;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/**
 * @mixin Withdrawal
 */
class WithdrawalResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'withdrawal_number' => $this->withdrawal_number,
            'amount' => (int) $this->amount,
            'fee' => (int) $this->fee,
            'nett' => (int) $this->nett,
            'bank_code' => $this->bank_code,
            'account_number' => $this->account_number,
            'account_name' => $this->account_name,
            'account_phone' => $this->account_phone,
            'status' => $this->status?->value,
            'notes' => $this->notes,
            'failure_reason' => $this->failure_reason,
            'approved_at' => $this->approved_at?->toIso8601String(),
            'disbursement_ref' => $this->disbursement_ref,
            'proof_url' => $this->proof_path ? Storage::disk('public')->url($this->proof_path) : null,
            'created_at' => $this->created_at?->toIso8601String(),
            // Only present for the finance (kita) view, which eager-loads it.
            // merchant_id is null for an internal withdrawal, so the loaded
            // relation itself can be null even when eager-loaded.
            'merchant' => $this->whenLoaded('merchant', fn () => $this->merchant ? [
                'id' => $this->merchant->id,
                'name' => $this->merchant->name,
                'email' => $this->merchant->email,
            ] : null),
            // The internal user who created an internal withdrawal (null for a
            // merchant-initiated one).
            'requester' => $this->whenLoaded('requester', fn () => $this->requester ? [
                'id' => $this->requester->id,
                'name' => $this->requester->name,
                'email' => $this->requester->email,
            ] : null),
        ];
    }
}
