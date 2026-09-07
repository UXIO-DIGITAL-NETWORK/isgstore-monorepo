<?php

namespace App\Http\Requests\Supplier;

use App\DTOs\Supplier\UpdateSupplierCategoryDTO;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSupplierCategoryRequest extends FormRequest
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
            // The provider's own free-text `kategori` string (e.g. "Mobile Legends").
            // Unique per supplier: the mapping is read in the kategori -> our-category
            // direction when a pooled SKU is promoted, so it has to be a function.
            // Validating it here turns the DB index into a 422 instead of a 500.
            'provider_category' => [
                'required', 'string', 'max:255',
                Rule::unique('supplier_categories')
                    ->ignore($this->route('supplierCategory'))
                    ->where(fn ($query) => $query->where('supplier_id', $this->input('supplier_id'))),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'provider_category.unique' => 'Kategori provider ini sudah dipetakan ke kategori lain untuk supplier tersebut.',
        ];
    }

    public function toDTO(): UpdateSupplierCategoryDTO
    {
        return new UpdateSupplierCategoryDTO(
            categoryId: $this->validated('category_id'),
            supplierId: $this->validated('supplier_id'),
            providerCategory: $this->validated('provider_category')
        );
    }
}
