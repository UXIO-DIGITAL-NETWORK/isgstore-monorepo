<?php

namespace App\Services;

use App\Models\MembershipPlan;
use App\Models\PricingRule;
use App\Models\Setting;
use Illuminate\Support\Collection;

/**
 * Computes a selling price per membership plan from a supplier cost, using
 * `pricing_rules`.
 *
 * Resolution per plan, most specific first:
 *
 *   (category, plan) → (NULL, plan) → (category, NULL) → (NULL, NULL) → default
 *
 * A rule with no plan applies to every plan — that is what lets an admin set
 * one category-wide markup without enumerating tiers, and it is the rung that
 * makes an admin-invented plan priced rather than unpriced.
 *
 * Rounding always uses ceil() so a computed price can never fall below cost.
 * Rules and plans are loaded once per instance, so a sync run over thousands of
 * products costs two queries.
 */
class PricingService
{
    /**
     * Used when nothing else answers: no override, no rule at any level, and no
     * configured setting. A single scalar rather than the old per-role map —
     * there is no sensible built-in default for a tier an admin invented this
     * morning, so every unconfigured plan gets the same conservative markup.
     */
    private const FALLBACK_MARKUP_PERCENT = 20.0;

    private ?Collection $rules = null;

    private ?Collection $plans = null;

    private ?float $settingMarkup = null;

    /**
     * Prices for every active plan.
     *
     * @param  array<int,float|null>  $marginOverrides  Keyed by membership plan id;
     *                                                  a non-null value wins over pricing_rules.
     * @param  int|null  $priceMin  Prices are clamped up to this floor when > 0.
     * @param  int|null  $priceMax  Prices are clamped down to this ceiling when > 0.
     * @return array<int,int> Keyed by membership plan id.
     */
    public function computePlanPrices(
        int $cost,
        ?int $categoryId,
        array $marginOverrides = [],
        ?int $priceMin = null,
        ?int $priceMax = null,
    ): array {
        $prices = [];

        foreach ($this->plans() as $planId) {
            $prices[$planId] = $this->clamp(
                $this->priceFor($cost, $planId, $categoryId, $marginOverrides[$planId] ?? null),
                $priceMin,
                $priceMax,
            );
        }

        return $prices;
    }

    /**
     * The five legacy `products.price_*` columns, derived from the plan prices.
     *
     * **Transitional.** `product_plan_prices` is the real answer now; these
     * columns survive because `price_member` is the denormalised default-plan
     * price that six sort/filter queries read, and because all five are NOT
     * NULL so every INSERT still has to supply them. `price_vip`,
     * `price_reseller` and `price_agent` are derived from whichever plan used to
     * grant that role — meaningful while the mapping exists, and dropped in a
     * follow-up migration once nothing writes them.
     *
     * @param  array<string,float|null>  $marginOverrides  Legacy role-keyed margins.
     * @return array{price_modal:int, price_member:int, price_vip:int, price_reseller:int, price_agent:int}
     */
    public function computePrices(
        int $cost,
        ?int $categoryId,
        array $marginOverrides = [],
        ?int $priceMin = null,
        ?int $priceMax = null,
    ): array {
        $planByRole = $this->planIdsByRoleName();

        // Translate the legacy role-keyed overrides onto plan ids.
        $planOverrides = [];
        foreach ($marginOverrides as $role => $margin) {
            $planId = $planByRole[strtolower((string) $role)] ?? null;
            if ($planId !== null && $margin !== null) {
                $planOverrides[$planId] = (float) $margin;
            }
        }

        $planPrices = $this->computePlanPrices($cost, $categoryId, $planOverrides, $priceMin, $priceMax);

        $defaultPlanId = $this->defaultPlanId();
        $base = $defaultPlanId !== null && isset($planPrices[$defaultPlanId])
            ? $planPrices[$defaultPlanId]
            // A default-plan override was given under the legacy 'member' key,
            // or no plans exist yet (a fresh database mid-migration).
            : $this->clamp($this->priceFor($cost, 0, $categoryId, $marginOverrides['member'] ?? null), $priceMin, $priceMax);

        $forRole = fn (string $role) => $planPrices[$planByRole[$role] ?? -1] ?? $base;

        return [
            'price_modal' => $cost,
            'price_member' => $base,
            'price_vip' => $forRole('vip'),
            'price_reseller' => $forRole('reseller'),
            'price_agent' => $forRole('agent'),
        ];
    }

    /**
     * Lowercased role name → the plan that grants it.
     *
     * `member` is special: no plan ever granted it — it was the free tier every
     * registration already had — so it maps to the default plan, which is that
     * same tier said in the new vocabulary. Without this the legacy
     * `margin_member` override would silently be dropped on the floor.
     *
     * @return array<string,int>
     */
    private function planIdsByRoleName(): array
    {
        $map = MembershipPlan::query()
            ->whereNotNull('membership_plans.role_id')
            ->join('roles', 'roles.id', '=', 'membership_plans.role_id')
            ->orderBy('membership_plans.id')
            ->pluck('membership_plans.id', 'roles.name')
            ->mapWithKeys(fn ($planId, $name) => [strtolower((string) $name) => (int) $planId])
            ->all();

        $defaultPlanId = $this->defaultPlanId();

        if ($defaultPlanId !== null && ! isset($map['member'])) {
            $map['member'] = $defaultPlanId;
        }

        return $map;
    }

    private function defaultPlanId(): ?int
    {
        $id = MembershipPlan::query()->where('is_default', true)->orderBy('id')->value('id');

        return $id ? (int) $id : null;
    }

    private function priceFor(int $cost, int $planId, ?int $categoryId, ?float $marginOverride = null): int
    {
        if ($marginOverride !== null) {
            return (int) ceil($cost * (1 + $marginOverride / 100));
        }

        $rule = $this->rules()->get($categoryId.'|'.$planId)
            ?? $this->rules()->get('|'.$planId)
            ?? $this->rules()->get($categoryId.'|')
            ?? $this->rules()->get('|');

        if ($rule) {
            return (int) ceil($cost * (1 + (float) $rule->markup_percent / 100)) + (int) $rule->markup_flat;
        }

        return (int) ceil($cost * (1 + $this->defaultMarkupPercent() / 100));
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

    /** @return Collection<int,int> Active plan ids, ordered as the admin sorted them. */
    private function plans(): Collection
    {
        return $this->plans ??= MembershipPlan::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->pluck('id')
            ->map(fn ($id) => (int) $id);
    }

    private function rules(): Collection
    {
        return $this->rules ??= PricingRule::all()
            ->keyBy(fn (PricingRule $rule) => ($rule->category_id ?? '').'|'.($rule->membership_plan_id ?? ''));
    }

    private function defaultMarkupPercent(): float
    {
        if ($this->settingMarkup !== null) {
            return $this->settingMarkup;
        }

        $configured = Setting::query()
            ->where('group', 'pricing')
            ->where('key', 'default_markup_percent')
            ->first()?->typedValue();

        return $this->settingMarkup = is_numeric($configured)
            ? (float) $configured
            : self::FALLBACK_MARKUP_PERCENT;
    }
}
