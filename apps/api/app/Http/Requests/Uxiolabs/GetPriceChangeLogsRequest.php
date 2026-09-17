<?php

namespace App\Http\Requests\Uxiolabs;

use App\DTOs\Uxiolabs\GetPriceChangeLogsDTO;
use Illuminate\Foundation\Http\FormRequest;

class GetPriceChangeLogsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['nullable', 'in:applied,unchanged,locked,deactivated,negative_margin,all'],
            'search' => ['nullable', 'string', 'max:100'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }

    public function toDTO(): GetPriceChangeLogsDTO
    {
        return new GetPriceChangeLogsDTO(
            status: $this->validated('status'),
            search: $this->validated('search'),
            dateFrom: $this->validated('date_from'),
            dateTo: $this->validated('date_to'),
            perPage: (int) ($this->validated('per_page') ?? 15),
        );
    }
}
