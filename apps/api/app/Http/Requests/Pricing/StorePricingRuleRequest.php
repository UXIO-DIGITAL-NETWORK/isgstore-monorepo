<?php

namespace App\Http\Requests\Pricing;

use App\DTOs\Pricing\CreatePricingRuleDTO;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePricingRuleRequest extends FormRequest
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
            'category_id' => ['nullable', 'exists:categories,id'],
            'role' => [
                'required',
                'string',
                Rule::in(['member', 'vip', 'reseller', 'agent']),
                // Uniqueness lives on `role` (never null) so a duplicate GLOBAL
                // rule (category_id null) is caught too — nullable fields skip
                // their own rules when null.
                Rule::unique('pricing_rules', 'role')
                    ->where(fn ($q) => $q->where('category_id', $this->input('category_id'))),
            ],
            'markup_percent' => ['required', 'numeric', 'min:0', 'max:1000'],
            'markup_flat' => ['required', 'integer', 'min:0'],
        ];
    }

    public function toDTO(): CreatePricingRuleDTO
    {
        return new CreatePricingRuleDTO(
            categoryId: $this->validated('category_id') !== null ? (int) $this->validated('category_id') : null,
            role: $this->validated('role'),
            markupPercent: (float) $this->validated('markup_percent'),
            markupFlat: (int) $this->validated('markup_flat'),
        );
    }
}
