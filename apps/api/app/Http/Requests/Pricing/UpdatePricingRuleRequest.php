<?php

namespace App\Http\Requests\Pricing;

use App\DTOs\Pricing\UpdatePricingRuleDTO;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePricingRuleRequest extends FormRequest
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
        $ruleId = $this->route('pricing_rule')?->id;

        return [
            'category_id' => ['nullable', 'exists:categories,id'],
            'role' => [
                'required',
                'string',
                Rule::in(['member', 'vip', 'reseller', 'agent']),
                // See StorePricingRuleRequest: uniqueness sits on `role` so
                // duplicate global rules (category_id null) are caught.
                Rule::unique('pricing_rules', 'role')
                    ->where(fn ($q) => $q->where('category_id', $this->input('category_id')))
                    ->ignore($ruleId),
            ],
            'markup_percent' => ['required', 'numeric', 'min:0', 'max:1000'],
            'markup_flat' => ['required', 'integer', 'min:0'],
        ];
    }

    public function toDTO(): UpdatePricingRuleDTO
    {
        return new UpdatePricingRuleDTO(
            categoryId: $this->validated('category_id') !== null ? (int) $this->validated('category_id') : null,
            role: $this->validated('role'),
            markupPercent: (float) $this->validated('markup_percent'),
            markupFlat: (int) $this->validated('markup_flat'),
        );
    }
}
