<?php

namespace App\Http\Requests\Digiflazz;

use Illuminate\Foundation\Http\FormRequest;

class CheckBillRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'buyer_sku_code' => ['required', 'string'],
            'customer_no'    => ['required', 'string', 'max:50'],
        ];
    }
}
