<?php

declare(strict_types=1);

namespace App\Http\Requests\Member;

use App\DTOs\Member\ListMemberTransactionsDTO;
use App\Enums\TransactionStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ListMemberTransactionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['nullable', Rule::enum(TransactionStatus::class)],
            'payment_channel_id' => ['nullable', 'integer', 'exists:payment_channels,id'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'search' => ['nullable', 'string', 'max:100'],
            'sort' => ['nullable', Rule::in(['newest', 'oldest', 'priceHigh', 'priceLow'])],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }

    public function toDTO(): ListMemberTransactionsDTO
    {
        return new ListMemberTransactionsDTO(
            status: $this->validated('status'),
            paymentChannelId: $this->validated('payment_channel_id') ? (int) $this->validated('payment_channel_id') : null,
            dateFrom: $this->validated('date_from'),
            dateTo: $this->validated('date_to'),
            search: $this->validated('search'),
            sort: $this->validated('sort') ?? 'newest',
            perPage: (int) ($this->validated('per_page') ?? 10),
        );
    }
}
