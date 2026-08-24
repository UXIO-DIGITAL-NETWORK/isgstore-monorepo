<?php

namespace App\Http\Requests\Uxiotopup;

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
            'only_configured' => ['nullable', 'boolean'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
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
            // Defaults to true: this panel exists to add SKUs for the games an admin
            // has actually configured, not to browse the provider's whole catalogue.
            'only_configured' => $this->has('only_configured') ? $this->boolean('only_configured') : true,
        ];
    }
}
