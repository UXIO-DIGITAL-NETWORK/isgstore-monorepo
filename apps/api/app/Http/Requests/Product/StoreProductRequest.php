<?php

namespace App\Http\Requests\Product;

use App\DTOs\Product\CreateProductDTO;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
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
            'sub_category_id' => ['nullable', 'exists:sub_categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:255', 'unique:products,code'],
            'price_modal' => ['required', 'integer'],
            'price_member' => ['required', 'integer'],
            'price_vip' => ['required', 'integer'],
            'price_reseller' => ['required', 'integer'],
            'price_agent' => ['required', 'integer'],
            'status' => ['required', 'boolean'],
        ];
    }

    public function toDTO(): CreateProductDTO
    {
        return new CreateProductDTO(
            categoryId: (int) $this->validated('category_id'),
            subCategoryId: $this->validated('sub_category_id') ? (int) $this->validated('sub_category_id') : null,
            name: $this->validated('name'),
            code: $this->validated('code'),
            priceModal: (int) $this->validated('price_modal'),
            priceMember: (int) $this->validated('price_member'),
            priceVip: (int) $this->validated('price_vip'),
            priceReseller: (int) $this->validated('price_reseller'),
            priceAgent: (int) $this->validated('price_agent'),
            status: (bool) $this->validated('status')
        );
    }
}
