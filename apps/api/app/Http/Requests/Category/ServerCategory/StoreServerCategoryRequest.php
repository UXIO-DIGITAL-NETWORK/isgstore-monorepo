<?php

namespace App\Http\Requests\Category\ServerCategory;

use Illuminate\Contracts\Validation\ValidationRule;
use App\DTOs\Category\ServerCategory\CreateServerCategoryDTO;
use Illuminate\Foundation\Http\FormRequest;

class StoreServerCategoryRequest extends FormRequest
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

    public function toDTO(): CreateServerCategoryDTO
    {
        return new CreateServerCategoryDTO(
            categoryId: $this->validated('category_id'),
            name: $this->validated('name')
        );
    }
}
