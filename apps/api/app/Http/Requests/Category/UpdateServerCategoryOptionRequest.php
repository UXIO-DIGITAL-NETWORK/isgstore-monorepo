<?php

namespace App\Http\Requests\Category;

use Illuminate\Contracts\Validation\ValidationRule;
use App\DTOs\Category\UpdateServerCategoryOptionDTO;
use Illuminate\Foundation\Http\FormRequest;

class UpdateServerCategoryOptionRequest extends FormRequest
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
            'server_category_id' => ['required', 'exists:server_categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'value' => ['required', 'string', 'max:255'],
        ];
    }

    public function toDTO(): UpdateServerCategoryOptionDTO
    {
        return new UpdateServerCategoryOptionDTO(
            serverCategoryId: $this->validated('server_category_id'),
            name: $this->validated('name'),
            value: $this->validated('value')
        );
    }
}
