<?php

namespace App\Http\Requests\Payment;

use Illuminate\Contracts\Validation\ValidationRule;
use App\DTOs\Payment\UpdatePaymentDTO;
use Illuminate\Foundation\Http\FormRequest;

class UpdatePaymentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'transaction_id' => ['required', 'exists:transactions,id'],
            'payment_channel_id' => ['required', 'exists:payment_channels,id'],
            'pg_transaction_id' => ['nullable', 'string', 'max:255'],
            'gross_amount' => ['required', 'integer'],
            'admin_fee' => ['required', 'integer'],
            'payment_data' => ['nullable', 'array'],
            'status' => ['required', 'string', 'max:255'],
            'paid_at' => ['nullable', 'date'],
        ];
    }

    public function toDTO(): UpdatePaymentDTO
    {
        return new UpdatePaymentDTO(
            transactionId: (int) $this->validated('transaction_id'),
            paymentChannelId: (int) $this->validated('payment_channel_id'),
            pgTransactionId: $this->validated('pg_transaction_id'),
            grossAmount: (int) $this->validated('gross_amount'),
            adminFee: (int) $this->validated('admin_fee'),
            paymentData: $this->validated('payment_data'),
            status: $this->validated('status'),
            paidAt: $this->validated('paid_at')
        );
    }
}
