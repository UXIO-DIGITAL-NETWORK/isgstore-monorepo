<?php

namespace App\Http\Requests\Digiflazz;

use App\DTOs\Digiflazz\CreateDigiflazzProductDTO;
use Illuminate\Foundation\Http\FormRequest;

class StoreDigiflazzProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'buyer_sku_code' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:prepaid,pasca'],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'sub_category_id' => ['nullable', 'integer', 'exists:sub_categories,id'],
            // Defaults: Digiflazz product_name / the SKU code itself
            'name' => ['nullable', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:255', 'unique:products,code'],
            // Manual add: the admin explicitly sets all 4 selling prices
            'price_member' => ['required', 'integer', 'min:0'],
            'price_vip' => ['required', 'integer', 'min:0'],
            'price_reseller' => ['required', 'integer', 'min:0'],
            'price_agent' => ['required', 'integer', 'min:0'],
            'status' => ['required', 'boolean'],
        ];
    }

    public function toDTO(): CreateDigiflazzProductDTO
    {
        return new CreateDigiflazzProductDTO(
            buyerSkuCode: $this->validated('buyer_sku_code'),
            type: $this->validated('type'),
            categoryId: (int) $this->validated('category_id'),
            subCategoryId: $this->validated('sub_category_id') ? (int) $this->validated('sub_category_id') : null,
            name: $this->validated('name') ?: null,
            code: $this->validated('code') ?: null,
            priceMember: (int) $this->validated('price_member'),
            priceVip: (int) $this->validated('price_vip'),
            priceReseller: (int) $this->validated('price_reseller'),
            priceAgent: (int) $this->validated('price_agent'),
            status: (bool) $this->validated('status'),
        );
    }
}
