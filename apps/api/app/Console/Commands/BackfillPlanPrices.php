<?php

namespace App\Console\Commands;

use App\Actions\Pricing\WritePlanPricesAction;
use App\Models\MembershipPlan;
use App\Models\Product;
use App\Models\ProductPlanPrice;
use App\Services\PricingService;
use App\Support\Membership\DefaultPlan;
use Illuminate\Console\Command;

/**
 * Give every product a price on every plan.
 *
 * **This must run in the same deploy step as `migrate`.** Until it has, the
 * price table is empty, `PlanPrice` falls through to `products.price_member`,
 * and every paying member is sold at the base tier. That is a silent revenue
 * leak, not an outage — nothing errors, the numbers are just wrong. It is
 * deliberately a command rather than inline migration work (thousands of rows
 * would block the deploy and could not be resumed), and deliberately not a
 * queued job (a stalled queue would mean wrong prices for hours with no signal).
 *
 * Seeds each plan from the price that plan's tier already had, so the cutover
 * changes no customer's price:
 *   - default plan  → products.price_member
 *   - plan → role   → the matching legacy column
 *   - anything else → recomputed from cost through the pricing rules
 *
 * Idempotent, and never touches a row an admin set by hand.
 */
class BackfillPlanPrices extends Command
{
    protected $signature = 'pricing:backfill-plan-prices {--dry-run : Report what would change without writing}';

    protected $description = 'Populate product_plan_prices for every product and membership plan';

    public function handle(PricingService $pricing, WritePlanPricesAction $writer): int
    {
        $defaultPlanId = DefaultPlan::id();

        if ($defaultPlanId === null) {
            $this->error('No default membership plan exists. Run the migrations first.');

            return self::FAILURE;
        }

        $plans = MembershipPlan::query()->orderBy('sort_order')->orderBy('id')->get();
        $legacyColumn = $this->legacyColumnByPlan($plans);

        $dryRun = (bool) $this->option('dry-run');
        $written = 0;
        $skipped = 0;

        Product::query()->with('planPrices')->chunkById(200, function ($products) use (
            $plans, $legacyColumn, $defaultPlanId, $pricing, $writer, $dryRun, &$written, &$skipped
        ) {
            foreach ($products as $product) {
                $computed = null;
                $planPrices = [];

                foreach ($plans as $plan) {
                    $planId = (int) $plan->id;

                    // Already priced (or hand-authored) — leave it exactly as is.
                    if ($product->planPrices->firstWhere('membership_plan_id', $planId)) {
                        $skipped++;

                        continue;
                    }

                    $column = $planId === $defaultPlanId ? 'price_member' : ($legacyColumn[$planId] ?? null);

                    if ($column !== null) {
                        $planPrices[$planId] = (int) $product->{$column};

                        continue;
                    }

                    // A plan with no legacy counterpart: derive it from cost.
                    $computed ??= $pricing->computePlanPrices(
                        (int) $product->price_modal,
                        $product->category_id,
                        [],
                        $product->price_min,
                        $product->price_max,
                    );

                    $planPrices[$planId] = $computed[$planId] ?? (int) $product->price_member;
                }

                if ($planPrices === []) {
                    return;
                }

                $written += count($planPrices);

                if (! $dryRun) {
                    $writer->execute($product, $planPrices);
                }
            }
        });

        $verb = $dryRun ? 'would write' : 'wrote';
        $this->info("Plan prices: {$verb} {$written} row(s), skipped {$skipped} already priced.");

        if (! $dryRun) {
            $this->info('Total rows now: '.ProductPlanPrice::count());
        }

        return self::SUCCESS;
    }

    /**
     * Which legacy price column each plan inherits, via the role it used to grant.
     *
     * @return array<int,string>
     */
    private function legacyColumnByPlan($plans): array
    {
        $columnByRole = [
            'vip' => 'price_vip',
            'reseller' => 'price_reseller',
            'agent' => 'price_agent',
            'member' => 'price_member',
        ];

        $map = [];

        foreach ($plans as $plan) {
            $roleName = strtolower((string) ($plan->role?->name ?? ''));

            if (isset($columnByRole[$roleName])) {
                $map[(int) $plan->id] = $columnByRole[$roleName];
            }
        }

        return $map;
    }
}
