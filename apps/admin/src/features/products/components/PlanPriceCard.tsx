import { useTranslation } from "react-i18next";
import { Lock } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/currency";
import type { PlanPricePreview } from "../types/product.type";

const rupiah = (value: number) => formatCurrency(value, { fractionDigits: 0 });

/**
 * Price breakdown for a SKU, one row per membership plan.
 *
 * The sibling `ProductPriceCell` renders the same structure against the four
 * frozen tiers (Public/VIP/Reseller/Agent) and still backs the product tables.
 * This one is driven by the plans themselves, because the Set Profit Margin
 * form asks for a margin per plan — showing four fixed tiers beside it meant a
 * plan the admin created had a field to type into but no row to read back.
 *
 * Margin maths and colours are deliberately identical to `ProductPriceCell`:
 * markup over cost (`margin / cost`), which is the number the admin typed,
 * `success` for money earned and `chart-1` for the percentage.
 */
export function PlanPriceCard({ cost, plans }: { cost: number; plans: PlanPricePreview[] }) {
  const { t } = useTranslation("products");
  return (
    <Box className="min-w-72 divide-y divide-border overflow-hidden rounded-lg border border-border">
      <Box className="flex items-center justify-between gap-3 px-3 py-2">
        <Text
          as="span"
          variant="muted"
        >{t("cost")}</Text>
        <Text
          as="span"
          className="font-medium tabular-nums"
        >
          {rupiah(cost)}
        </Text>
      </Box>

      {plans.length === 0 ? (
        <Box className="px-3 py-2">
          <Text variant="muted">{t("noPricedPlans")}</Text>
        </Box>
      ) : (
        plans.map((plan) => {
          const margin = plan.price - cost;
          return (
            <Box
              key={plan.membership_plan_id}
              className="flex items-center justify-between gap-3 px-3 py-2"
            >
              <Box className="flex items-center gap-1.5">
                <Text as="span">{plan.plan_name}</Text>
                {/* The default tier is what an unsubscribed buyer pays — the
                    retail price, marked here as the product table marks it. */}
                {plan.is_default ? (
                  <Lock
                    className="size-3.5 text-muted-foreground"
                    aria-hidden="true"
                  />
                ) : null}
              </Box>
              <Box className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-success/30 bg-success/10 text-success tabular-nums"
                >
                  {rupiah(margin)}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-chart-1/30 bg-chart-1/10 text-chart-1 tabular-nums"
                >
                  {cost > 0 ? `${((margin / cost) * 100).toFixed(1)}%` : "—"}
                </Badge>
                <Text
                  as="span"
                  className="font-medium tabular-nums"
                >
                  {rupiah(plan.price)}
                </Text>
              </Box>
            </Box>
          );
        })
      )}
    </Box>
  );
}
