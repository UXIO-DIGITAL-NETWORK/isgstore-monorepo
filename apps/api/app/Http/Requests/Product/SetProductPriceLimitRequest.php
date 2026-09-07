<?php

namespace App\Http\Requests\Product;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class SetProductPriceLimitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // 0/null = no limit.
            'price_min' => ['nullable', 'integer', 'min:0'],
            'price_max' => ['nullable', 'integer', 'min:0'],
        ];
    }

    public function priceMin(): ?int
    {
        return $this->filled('price_min') ? (int) $this->validated('price_min') : null;
    }

    public function priceMax(): ?int
    {
        return $this->filled('price_max') ? (int) $this->validated('price_max') : null;
    }
}
