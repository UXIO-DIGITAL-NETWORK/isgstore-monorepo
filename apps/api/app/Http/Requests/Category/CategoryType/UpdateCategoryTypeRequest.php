<?php

namespace App\Http\Requests\Category\CategoryType;

use App\DTOs\Category\CategoryType\UpdateCategoryTypeDTO;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateCategoryTypeRequest extends FormRequest
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

    public function toDTO(): UpdateCategoryTypeDTO
    {
        return new UpdateCategoryTypeDTO(
            name: $this->validated('name'),
            status: $this->validated('status')
        );
    }
}
