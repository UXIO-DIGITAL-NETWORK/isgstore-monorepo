<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Per-SKU profit margins, one row per (supplier mapping × membership plan).
 *
 * Replaces `supplier_products.margin_{member,vip,reseller,agent}` — the last
 * four-tier cap left in the pricing chain. Product prices already moved to
 * `product_plan_prices`; this is the authored figure those prices are computed
 * from, and an admin could not set it for a plan they had just created.
 *
 * It lives on the **mapping** rather than on `product_plan_prices` because a
 * pooled SKU has no product yet: pricing a SKU before it becomes sellable is
 * the whole point of the pool, so the margin has to survive until promote reads
 * it. `product_plan_prices.margin_percent` keeps a copy of whatever was
 * actually applied.
 *
 * A missing row means "fall through to the pricing rules" — a legitimate
 * choice, which is why `supplier_products.margin_set_at` remains the gate the
 * promote check asks about. It answers "did an admin decide?", not "is there a
 * number?".
 *
 * The legacy columns are backfilled across and then left frozen for one
 * release; dropping them in the same deploy would break any writer that was
 * missed, on a live pricing path.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supplier_product_margins', function (Blueprint $table) {
            $table->id();

            $table->foreignId('supplier_product_id')->constrained('supplier_products')->cascadeOnDelete();
            $table->foreignId('membership_plan_id')->constrained('membership_plans')->cascadeOnDelete();
            $table->unique(['supplier_product_id', 'membership_plan_id'], 'supplier_product_plan_unique');

            // Same shape as the columns it replaces: percent over supplier cost.
            // Negative is allowed — selling under cost is a decision an admin is
            // permitted to make, and the checkout margin guard catches it.
            $table->decimal('margin_percent', 6, 2);

            $table->timestamps();
        });

        $this->backfillFromLegacyColumns();
    }

    /**
     * Copy each legacy per-role margin onto the plan that used to grant that
     * role, so nobody's authored numbers are lost at the cutover. `member` maps
     * to the default plan — no plan ever granted it, it was the free tier.
     */
    private function backfillFromLegacyColumns(): void
    {
        $defaultPlanId = DB::table('membership_plans')->where('is_default', true)->value('id');

        $planByRole = [];

        foreach (DB::table('membership_plans')->whereNotNull('role_id')->orderBy('id')->get() as $plan) {
            $roleName = DB::table('roles')->where('id', $plan->role_id)->value('name');

            if ($roleName !== null) {
                $planByRole[strtolower((string) $roleName)] ??= $plan->id;
            }
        }

        if ($defaultPlanId !== null) {
            $planByRole['member'] ??= $defaultPlanId;
        }

        $columnByRole = [
            'member' => 'margin_member',
            'vip' => 'margin_vip',
            'reseller' => 'margin_reseller',
            'agent' => 'margin_agent',
        ];

        $now = now();

        DB::table('supplier_products')->orderBy('id')->chunk(200, function ($mappings) use ($planByRole, $columnByRole, $now) {
            $rows = [];

            foreach ($mappings as $mapping) {
                foreach ($columnByRole as $role => $column) {
                    $margin = $mapping->{$column} ?? null;
                    $planId = $planByRole[$role] ?? null;

                    if ($margin === null || $planId === null) {
                        continue;
                    }

                    $rows[] = [
                        'supplier_product_id' => $mapping->id,
                        'membership_plan_id' => $planId,
                        'margin_percent' => $margin,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }
            }

            if ($rows !== []) {
                DB::table('supplier_product_margins')->insert($rows);
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supplier_product_margins');
    }
};
