<?php

namespace App\Http\Requests\Supplier;

use Illuminate\Contracts\Validation\ValidationRule;
use App\DTOs\Supplier\CreateSupplierCategoryDTO;
use Illuminate\Foundation\Http\FormRequest;

class StoreSupplierCategoryRequest extends FormRequest
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
            'supplier_id' => ['required', 'exists:suppliers,id'],
            'template_code' => ['required', 'string', 'max:255'],
        ];
    }

    public function toDTO(): CreateSupplierCategoryDTO
    {
        return new CreateSupplierCategoryDTO(
            categoryId: $this->validated('category_id'),
            supplierId: $this->validated('supplier_id'),
            templateCode: $this->validated('template_code')
        );
    }
}
