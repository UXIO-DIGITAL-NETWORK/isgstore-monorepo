<?php

namespace App\Http\Requests\Refund;

use App\DTOs\Refund\ListRefundRequestsDTO;
use App\Enums\RefundMethod;
use App\Enums\RefundStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ListRefundRequestsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'status' => ['nullable', 'string', Rule::enum(RefundStatus::class)],
            'method' => ['nullable', 'string', Rule::enum(RefundMethod::class)],
            'search' => ['nullable', 'string', 'max:255'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
        ];
    }

    public function toDTO(): ListRefundRequestsDTO
    {
        return new ListRefundRequestsDTO(
            perPage: (int) ($this->validated('per_page') ?? 15),
            status: $this->validated('status'),
            method: $this->validated('method'),
            search: $this->validated('search'),
            startDate: $this->validated('date_from'),
            endDate: $this->validated('date_to'),
        );
    }
}
