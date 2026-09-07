<?php

namespace App\Http\Requests\Transaction;

use App\DTOs\Transaction\ManualReviewTransactionDTO;
use App\Enums\TransactionStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ManualReviewTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // REFUNDED is excluded on purpose. It now asserts that money went
            // back to the customer, and it is written only by the refund flow
            // (member wallet credit, or an admin completing a manual transfer).
            // A dropdown that could set it would let the books claim a refund
            // that never happened.
            'status' => [
                'required',
                'string',
                Rule::enum(TransactionStatus::class)->except([TransactionStatus::REFUNDED]),
            ],
            'sn' => ['nullable', 'string', 'max:255'],
            'proof' => ['nullable', 'file', 'mimes:jpeg,png,jpg,webp,pdf', 'max:2048'],
        ];
    }

    public function toDTO(): ManualReviewTransactionDTO
    {
        return new ManualReviewTransactionDTO(
            status: $this->validated('status'),
            sn: $this->validated('sn'),
            proof: $this->file('proof'),
        );
    }
}
