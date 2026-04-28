<?php

namespace App\Http\Requests\Category;

use Illuminate\Contracts\Validation\ValidationRule;
use App\DTOs\Category\CreateCategoryTypeDTO;
use Illuminate\Foundation\Http\FormRequest;

class StoreCategoryTypeRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'status' => ['required', 'boolean'],
        ];
    }

    public function toDTO(): CreateCategoryTypeDTO
    {
        return new CreateCategoryTypeDTO(
            name: $this->validated('name'),
            status: $this->validated('status')
        );
    }
}
