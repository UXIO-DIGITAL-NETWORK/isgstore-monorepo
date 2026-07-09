<?php

namespace App\Http\Requests\Category\ServerCategory;

use App\DTOs\Category\ServerCategory\UpdateServerCategoryDTO;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateServerCategoryRequest extends FormRequest
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
            'category_id' => ['required', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:255'],
        ];
    }

    public function toDTO(): UpdateServerCategoryDTO
    {
        return new UpdateServerCategoryDTO(
            categoryId: $this->validated('category_id'),
            name: $this->validated('name')
        );
    }
}
