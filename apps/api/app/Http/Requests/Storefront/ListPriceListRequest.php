<?php

declare(strict_types=1);

namespace App\Http\Requests\Storefront;

use App\DTOs\Storefront\ListPriceListDTO;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ListPriceListRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:100'],
            'game' => ['nullable', 'string', 'max:100'],
            'sort' => ['nullable', Rule::in(['default', 'name-asc', 'price-asc', 'price-desc'])],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }

    public function toDTO(): ListPriceListDTO
    {
        return new ListPriceListDTO(
            search: $this->validated('search'),
            game: $this->validated('game'),
            sort: $this->validated('sort') ?? 'default',
            perPage: (int) ($this->validated('per_page') ?? 10),
        );
    }
}
