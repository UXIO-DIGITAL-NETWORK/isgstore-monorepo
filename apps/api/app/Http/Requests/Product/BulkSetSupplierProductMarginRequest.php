<?php

namespace App\Http\Requests\Product;

use App\Services\ProductRepricer;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class BulkSetSupplierProductMarginRequest extends FormRequest
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
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:supplier_products,id'],
            'margin_member' => ['nullable', 'numeric', 'min:-100', 'max:1000'],
            'margin_vip' => ['nullable', 'numeric', 'min:-100', 'max:1000'],
            'margin_reseller' => ['nullable', 'numeric', 'min:-100', 'max:1000'],
            'margin_agent' => ['nullable', 'numeric', 'min:-100', 'max:1000'],
            // Optional selling-price window, carried onto the product at promote.
            // 0/null = no limit, matching products.price_min/max.
            'price_min' => ['nullable', 'integer', 'min:0'],
            'price_max' => ['nullable', 'integer', 'min:0', 'gte:price_min'],
            'margins' => ['sometimes', 'array'],
            'margins.*' => ['nullable', 'numeric', 'min:-100', 'max:1000'],
        ];
    }

    /**
     * Margins keyed by membership plan id. See
     * `SetSupplierProductMarginRequest::planMargins()` — same rules, same
     * legacy-body translation.
     *
     * @return array<int,float|null>
     */
    public function planMargins(): array
    {
        $margins = [];

        foreach ((array) $this->input('margins', []) as $planId => $value) {
            if (! is_numeric($planId)) {
                continue;
            }

            $margins[(int) $planId] = ($value === null || $value === '') ? null : (float) $value;
        }

        if ($margins !== []) {
            return $margins;
        }

        foreach (ProductRepricer::planIdByRole() as $role => $planId) {
            $field = 'margin_'.$role;

            if ($this->has($field)) {
                $margins[$planId] = $this->filled($field) ? (float) $this->input($field) : null;
            }
        }

        return $margins;
    }

    public function priceMin(): ?int
    {
        return $this->filled('price_min') ? (int) $this->validated('price_min') : null;
    }

    public function priceMax(): ?int
    {
        return $this->filled('price_max') ? (int) $this->validated('price_max') : null;
    }

    /**
     * Whether the caller sent the limit fields at all. A margin form without them
     * must leave an existing window alone rather than silently clearing it.
     */
    public function limitsProvided(): bool
    {
        return $this->has('price_min') || $this->has('price_max');
    }
}
