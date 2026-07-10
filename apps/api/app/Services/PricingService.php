<?php

namespace App\Services;

use App\Models\PricingRule;
use Illuminate\Support\Collection;

/**
 * Computes role-based selling prices from a supplier cost using pricing_rules.
 *
 * Rule resolution per role: (category_id, role) → (NULL, role) → built-in
 * default. Rounding always uses ceil() so a computed price can never fall
 * below cost. Rules are loaded once per instance so a sync run over thousands
 * of products costs a single query.
 */
class PricingService
{
    /**
     * Used when no pricing_rules rows exist (e.g. fresh production DB before
     * rules are configured). Mirrors the seeded tiers so products are never
     * silently sold at cost.
     */
    private const DEFAULT_MARKUP_PERCENT = [
        'member' => 20.0,
        'vip' => 15.0,
        'reseller' => 10.0,
        'agent' => 5.0,
    ];

    private ?Collection $rules = null;

    /**
     * @return array{price_modal:int, price_member:int, price_vip:int, price_reseller:int, price_agent:int}
     */
    public function computePrices(int $cost, ?int $categoryId): array
    {
        return [
            'price_modal' => $cost,
            'price_member' => $this->priceFor($cost, 'member', $categoryId),
            'price_vip' => $this->priceFor($cost, 'vip', $categoryId),
            'price_reseller' => $this->priceFor($cost, 'reseller', $categoryId),
            'price_agent' => $this->priceFor($cost, 'agent', $categoryId),
        ];
    }

    private function priceFor(int $cost, string $role, ?int $categoryId): int
    {
        $rule = $this->rules()->get($categoryId.'|'.$role) ?? $this->rules()->get('|'.$role);

        if ($rule) {
            return (int) ceil($cost * (1 + (float) $rule->markup_percent / 100)) + (int) $rule->markup_flat;
        }

        return (int) ceil($cost * (1 + self::DEFAULT_MARKUP_PERCENT[$role] / 100));
    }

    private function rules(): Collection
    {
        return $this->rules ??= PricingRule::all()
            ->keyBy(fn (PricingRule $rule) => ($rule->category_id ?? '').'|'.$rule->role);
    }
}
