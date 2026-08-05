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
            // Manual add: the admin normally sets all 4 selling prices, but they
            // are nullable so a quick/bulk add can omit them and let
            // PricingService derive defaults from the Digiflazz cost + category.
            'price_member' => ['nullable', 'integer', 'min:0'],
            'price_vip' => ['nullable', 'integer', 'min:0'],
            'price_reseller' => ['nullable', 'integer', 'min:0'],
            'price_agent' => ['nullable', 'integer', 'min:0'],
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
            // Preserve null (not 0) when a price is omitted so CreateDigiflazzProductAction
            // falls back to PricingService instead of persisting a zero selling price.
            priceMember: $this->filled('price_member') ? (int) $this->validated('price_member') : null,
            priceVip: $this->filled('price_vip') ? (int) $this->validated('price_vip') : null,
            priceReseller: $this->filled('price_reseller') ? (int) $this->validated('price_reseller') : null,
            priceAgent: $this->filled('price_agent') ? (int) $this->validated('price_agent') : null,
            status: (bool) $this->validated('status'),
        );
    }
}
