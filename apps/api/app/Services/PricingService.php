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
     * @param  array<string,float|null>  $marginOverrides  Per-role markup percent (member/vip/reseller/agent);
     *                                                     a non-null value wins over pricing_rules for that role.
     * @param  int|null  $priceMin  Selling prices are clamped up to this floor when > 0.
     * @param  int|null  $priceMax  Selling prices are clamped down to this ceiling when > 0.
     * @return array{price_modal:int, price_member:int, price_vip:int, price_reseller:int, price_agent:int}
     */
    public function computePrices(
        int $cost,
        ?int $categoryId,
        array $marginOverrides = [],
        ?int $priceMin = null,
        ?int $priceMax = null,
    ): array {
        return [
            'price_modal' => $cost,
            'price_member' => $this->tierPrice($cost, 'member', $categoryId, $marginOverrides, $priceMin, $priceMax),
            'price_vip' => $this->tierPrice($cost, 'vip', $categoryId, $marginOverrides, $priceMin, $priceMax),
            'price_reseller' => $this->tierPrice($cost, 'reseller', $categoryId, $marginOverrides, $priceMin, $priceMax),
            'price_agent' => $this->tierPrice($cost, 'agent', $categoryId, $marginOverrides, $priceMin, $priceMax),
        ];
    }

    /**
     * @param  array<string,float|null>  $marginOverrides
     */
    private function tierPrice(
        int $cost,
        string $role,
        ?int $categoryId,
        array $marginOverrides,
        ?int $priceMin,
        ?int $priceMax,
    ): int {
        return $this->clamp($this->priceFor($cost, $role, $categoryId, $marginOverrides[$role] ?? null), $priceMin, $priceMax);
    }

    private function priceFor(int $cost, string $role, ?int $categoryId, ?float $marginOverride = null): int
    {
        if ($marginOverride !== null) {
            return (int) ceil($cost * (1 + $marginOverride / 100));
        }

        $rule = $this->rules()->get($categoryId.'|'.$role) ?? $this->rules()->get('|'.$role);

        if ($rule) {
            return (int) ceil($cost * (1 + (float) $rule->markup_percent / 100)) + (int) $rule->markup_flat;
        }

        return (int) ceil($cost * (1 + self::DEFAULT_MARKUP_PERCENT[$role] / 100));
    }

    /** Clamp to [min, max] when either bound is a positive limit (0/null = no limit). */
    private function clamp(int $price, ?int $priceMin, ?int $priceMax): int
    {
        if ($priceMin !== null && $priceMin > 0 && $price < $priceMin) {
            $price = $priceMin;
        }

        if ($priceMax !== null && $priceMax > 0 && $price > $priceMax) {
            $price = $priceMax;
        }

        return $price;
    }

    private function rules(): Collection
    {
        return $this->rules ??= PricingRule::all()
            ->keyBy(fn (PricingRule $rule) => ($rule->category_id ?? '').'|'.$rule->role);
    }
}
