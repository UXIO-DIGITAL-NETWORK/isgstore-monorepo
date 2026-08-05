<?php

namespace App\Http\Requests\Digiflazz;

use Illuminate\Foundation\Http\FormRequest;

class BulkStoreDigiflazzProductsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => ['required', 'in:prepaid,pasca'],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'sub_category_id' => ['nullable', 'integer', 'exists:sub_categories,id'],
            'status' => ['required', 'boolean'],
            // One shared category for the whole batch; selling prices are derived
            // per SKU by PricingService (no per-row price input in bulk mode).
            'buyer_sku_codes' => ['required', 'array', 'min:1', 'max:200'],
            'buyer_sku_codes.*' => ['required', 'string', 'max:255'],
        ];
    }
}
