<?php

namespace App\Http\Requests\Uxiolabs;

use Illuminate\Foundation\Http\FormRequest;

class PoolCandidateQueryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Query params arrive as strings — axios serializes a JS boolean to the literal
     * "true"/"false", which Laravel's `boolean` rule rejects. Normalize first, the
     * same way PriceListQueryRequest does.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('only_configured')) {
            $this->merge([
                'only_configured' => filter_var($this->only_configured, FILTER_VALIDATE_BOOLEAN),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:255'],
            'provider_category' => ['nullable', 'string', 'max:255'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            // "new" (default) hides everything already pooled and everything the
            // provider has offered for a while; "all" shows the raw feed.
            'pool_state' => ['nullable', 'in:new,not_pooled,all'],
            'availability' => ['nullable', 'in:available,unavailable,all'],
            // Supplier cost, in whole rupiah. Bounds are inclusive, so a figure
            // read straight off a row matches that row.
            'cost_min' => ['nullable', 'integer', 'min:0'],
            // `gte` only once there is something to compare against: with
            // `cost_min` absent it compares the ceiling to null and rejects
            // every ceiling-only query.
            'cost_max' => ['nullable', 'integer', 'min:0', ...$this->filled('cost_min') ? ['gte:cost_min'] : []],
            'sort' => ['nullable', 'in:name_asc,name_desc,cost_asc,cost_desc'],
            'only_configured' => ['nullable', 'boolean'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            // An inverted range is a typo, not a query — say so plainly rather
            // than answering with an empty table the admin has to diagnose.
            'cost_max.gte' => 'Harga maksimum tidak boleh lebih kecil dari harga minimum.',
        ];
    }

    /**
     * @return array<string,mixed>
     */
    public function filters(): array
    {
        return [
            'search' => $this->query('search'),
            'provider_category' => $this->query('provider_category'),
            'category_id' => $this->query('category_id'),
            'pool_state' => $this->query('pool_state', 'new'),
            'availability' => $this->query('availability', 'available'),
            // Left absent rather than passed as null when unset: the action
            // distinguishes "no floor" from "a floor of zero".
            ...$this->has('cost_min') && $this->query('cost_min') !== '' ? ['cost_min' => (int) $this->query('cost_min')] : [],
            ...$this->has('cost_max') && $this->query('cost_max') !== '' ? ['cost_max' => (int) $this->query('cost_max')] : [],
            'sort' => $this->query('sort'),
            // Defaults to true: this panel exists to add SKUs for the games an admin
            // has actually configured, not to browse the provider's whole catalogue.
            'only_configured' => $this->has('only_configured') ? $this->boolean('only_configured') : true,
        ];
    }
}
