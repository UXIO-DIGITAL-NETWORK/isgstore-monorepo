<?php

namespace App\Http\Requests\Uxiolabs;

use Illuminate\Foundation\Http\FormRequest;

class PoolUxiolabsSkusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Capped at 200 to match BulkStoreUxiolabsProductsRequest — the pool
            // insert is one statement, but the price-list index is per request.
            'buyer_sku_codes' => ['required', 'array', 'min:1', 'max:200'],
            'buyer_sku_codes.*' => ['required', 'string', 'max:255'],
        ];
    }

    /**
     * @return array<int,string>
     */
    public function skuCodes(): array
    {
        return array_map('strval', $this->validated('buyer_sku_codes'));
    }
}
