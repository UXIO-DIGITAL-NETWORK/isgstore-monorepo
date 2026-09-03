<?php

declare(strict_types=1);

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Per-plan margins for a product, edited from the Main Products form.
 *
 * The same vocabulary as `SetSupplierProductMarginRequest` — margins keyed by
 * membership plan id, an optional price window, optional points — because the
 * product screen and the provider screen must not disagree about what a margin
 * means. The action delegates to the provider one wherever a mapping exists.
 */
class SetProductMarginRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            // A plan present with null is an explicit "use the pricing rules";
            // a plan absent entirely is left exactly as it was.
            'margins' => ['sometimes', 'array'],
            'margins.*' => ['nullable', 'numeric', 'min:-100', 'max:1000'],
            'price_min' => ['nullable', 'integer', 'min:0'],
            'price_max' => ['nullable', 'integer', 'min:0', 'gte:price_min'],
            'point_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'point_flat' => ['nullable', 'integer', 'min:0'],
        ];
    }

    /** @return array<int,float|null> Keyed by membership plan id. */
    public function planMargins(): array
    {
        $margins = [];

        foreach ((array) $this->input('margins', []) as $planId => $value) {
            if (! is_numeric($planId)) {
                continue;
            }

            $margins[(int) $planId] = ($value === null || $value === '') ? null : (float) $value;
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

    /** A form without the limit fields must leave an existing window alone. */
    public function limitsProvided(): bool
    {
        return $this->has('price_min') || $this->has('price_max');
    }

    public function pointPercent(): ?float
    {
        return $this->filled('point_percent') ? (float) $this->validated('point_percent') : null;
    }

    public function pointFlat(): ?int
    {
        return $this->filled('point_flat') ? (int) $this->validated('point_flat') : null;
    }

    public function pointsProvided(): bool
    {
        return $this->has('point_percent') || $this->has('point_flat');
    }
}
