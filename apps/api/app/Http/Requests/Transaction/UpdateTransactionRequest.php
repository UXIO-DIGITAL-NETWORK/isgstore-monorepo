<?php

namespace App\Http\Requests\Transaction;

use App\DTOs\Transaction\UpdateTransactionDTO;
use App\Enums\TransactionStatus;
use App\Http\Requests\Concerns\NormalizesPhoneInput;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTransactionRequest extends FormRequest
{
    use NormalizesPhoneInput;

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->normalizePhoneFields(['guest_contact']);
    }

    public function rules(): array
    {
        return [
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'payment_channel_id' => ['nullable', 'integer', 'exists:payment_channels,id'],
            'supplier_id' => ['nullable', 'integer', 'exists:suppliers,id'],
            // Canonical E.164, rewritten by prepareForValidation().
            'guest_contact' => ['nullable', 'string', 'max:20', self::E164_RULE],
            'target_uid' => ['nullable', 'string', 'max:255'],
            'target_server' => ['nullable', 'string', 'max:255'],
            'amount_base' => ['required', 'integer', 'min:0'],
            'amount_fee' => ['sometimes', 'integer', 'min:0'],
            'amount_total' => ['sometimes', 'integer', 'min:0'],
            'total_price' => ['sometimes', 'integer', 'min:0'],
            'margin' => ['sometimes', 'integer'],
            'status' => ['required', 'string', Rule::enum(TransactionStatus::class)],
            'is_manual' => ['sometimes', 'boolean'],
            'sn' => ['nullable', 'string', 'max:255'],
            'supplier_trx_id' => ['nullable', 'string', 'max:255'],
            'supplier_status' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function toDTO(): UpdateTransactionDTO
    {
        $validated = $this->validated();

        return new UpdateTransactionDTO(
            userId: isset($validated['user_id']) ? (int) $validated['user_id'] : null,
            paymentChannelId: isset($validated['payment_channel_id']) ? (int) $validated['payment_channel_id'] : null,
            supplierId: isset($validated['supplier_id']) ? (int) $validated['supplier_id'] : null,
            guestContact: $validated['guest_contact'] ?? null,
            targetUid: $validated['target_uid'] ?? null,
            targetServer: $validated['target_server'] ?? null,
            amountBase: (int) $validated['amount_base'],
            amountFee: (int) ($validated['amount_fee'] ?? 0),
            amountTotal: (int) ($validated['amount_total'] ?? $validated['amount_base']),
            totalPrice: (int) ($validated['total_price'] ?? $validated['amount_base']),
            margin: (int) ($validated['margin'] ?? 0),
            status: $validated['status'],
            isManual: (bool) ($validated['is_manual'] ?? false),
            sn: $validated['sn'] ?? null,
            supplierTrxId: $validated['supplier_trx_id'] ?? null,
            supplierStatus: $validated['supplier_status'] ?? null,
        );
    }
}
