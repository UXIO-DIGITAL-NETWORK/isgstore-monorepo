<?php

namespace App\Http\Requests\Pricing;

use App\DTOs\Pricing\UpdatePricingRuleDTO;
use App\Models\PricingRule;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

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
        return [
            'category_id' => ['nullable', 'exists:categories,id'],
            // Null means "every plan" — the rung that keeps an admin-invented
            // tier priced instead of unpriced. It also means the DB unique
            // index cannot help (MySQL treats NULLs as distinct), so the guard
            // below is the only thing stopping two identical rules.
            'membership_plan_id' => ['nullable', 'integer', 'exists:membership_plans,id'],
            'markup_percent' => ['required', 'numeric', 'min:0', 'max:1000'],
            'markup_flat' => ['required', 'integer', 'min:0'],
        ];
    }

    /** See StorePricingRuleRequest — the same gap, minus this rule's own row. */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $exists = PricingRule::query()
                ->where('category_id', $this->input('category_id'))
                ->where('membership_plan_id', $this->input('membership_plan_id'))
                ->whereKeyNot($this->route('pricing_rule')?->id)
                ->exists();

            if ($exists) {
                $validator->errors()->add('membership_plan_id', 'Aturan untuk kombinasi kategori dan paket ini sudah ada.');
            }
        });
    }

    public function toDTO(): UpdatePricingRuleDTO
    {
        return new UpdatePricingRuleDTO(
            categoryId: $this->validated('category_id') !== null ? (int) $this->validated('category_id') : null,
            membershipPlanId: $this->validated('membership_plan_id') !== null ? (int) $this->validated('membership_plan_id') : null,
            markupPercent: (float) $this->validated('markup_percent'),
            markupFlat: (int) $this->validated('markup_flat'),
        );
    }
}
