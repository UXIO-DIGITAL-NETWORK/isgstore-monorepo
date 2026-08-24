<?php

namespace App\Http\Requests\Uxiotopup;

use Illuminate\Foundation\Http\FormRequest;

class PoolUxiotopupSkusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Capped at 200 to match BulkStoreUxiotopupProductsRequest — the pool
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
