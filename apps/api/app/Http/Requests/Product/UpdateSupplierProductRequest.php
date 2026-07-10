<?php

namespace App\Http\Requests\Product;

use App\DTOs\Product\UpdateSupplierProductDTO;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateSupplierProductRequest extends FormRequest
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
            'product_id' => ['required', 'exists:products,id'],
            'supplier_id' => ['required', 'exists:suppliers,id'],
            'buyer_sku_code' => ['required', 'string', 'max:255'],
            'price' => ['required', 'integer'],
            'buyer_product_status' => ['required', 'boolean'],
            'seller_product_status' => ['required', 'boolean'],
            'is_active' => ['required', 'boolean'],
        ];
    }

    public function toDTO(): UpdateSupplierProductDTO
    {
        return new UpdateSupplierProductDTO(
            productId: (int) $this->validated('product_id'),
            supplierId: (int) $this->validated('supplier_id'),
            buyerSkuCode: $this->validated('buyer_sku_code'),
            price: (int) $this->validated('price'),
            buyerProductStatus: (bool) $this->validated('buyer_product_status'),
            sellerProductStatus: (bool) $this->validated('seller_product_status'),
            isActive: (bool) $this->validated('is_active')
        );
    }
}
