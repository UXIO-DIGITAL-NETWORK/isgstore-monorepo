<?php

namespace App\Http\Requests\Category;

use Illuminate\Contracts\Validation\ValidationRule;
use App\DTOs\Category\CreateSubCategoryDTO;
use Illuminate\Foundation\Http\FormRequest;

class StoreSubCategoryRequest extends FormRequest
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
            'logo' => ['nullable', 'string', 'max:255'],
            'status' => ['required', 'boolean'],
        ];
    }

    public function toDTO(): CreateSubCategoryDTO
    {
        return new CreateSubCategoryDTO(
            categoryId: $this->validated('category_id'),
            name: $this->validated('name'),
            logo: $this->validated('logo'),
            status: $this->validated('status')
        );
    }
}
