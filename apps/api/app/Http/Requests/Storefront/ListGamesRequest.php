<?php

declare(strict_types=1);

namespace App\Http\Requests\Storefront;

use App\DTOs\Storefront\ListGamesDTO;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ListGamesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:100'],
            'type_id' => ['nullable', 'integer', 'exists:category_types,id'],
            'sort' => ['nullable', Rule::in(['name', 'popular'])],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }

    public function toDTO(): ListGamesDTO
    {
        return new ListGamesDTO(
            search: $this->validated('search'),
            typeId: $this->validated('type_id') ? (int) $this->validated('type_id') : null,
            sort: $this->validated('sort') ?? 'name',
            perPage: (int) ($this->validated('per_page') ?? 24),
        );
    }
}
