import { Lock } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/currency";
import { PRICE_TIERS, type PriceTier, type ProductVariant } from "../types/product.type";

const TIER_LABELS: Record<PriceTier, string> = {
  public: "Public",
  vip: "VIP",
  reseller: "Reseller",
  agent: "Agent",
};

const rupiah = (value: number) => formatCurrency(value, { fractionDigits: 0 });

/**
 * Price breakdown for one variant: the upstream cost, then each customer
 * tier's selling price with its margin in rupiah and as a share of that
 * selling price (the reference's two badges — 62.857 over a 58.745 cost is
 * Rp 4.112 at 6.5%).
 *
 * Colour is functional only per design_system.md §3.2 — `success` for money
 * earned, `chart-1` for the percentage, and hairline `border-border` rows
 * carry the structure.
 */
function VariantPriceCard({ variant }: { variant: ProductVariant }) {
  return (
    <Box className="min-w-72 divide-y divide-border overflow-hidden rounded-lg border border-border">
      <Box className="flex items-center justify-between gap-3 px-3 py-2">
        <Text
          as="span"
          variant="muted"
        >
          Cost
        </Text>
        <Text
          as="span"
          className="font-medium tabular-nums"
        >
          {rupiah(variant.cost_price)}
        </Text>
      </Box>

      {PRICE_TIERS.map((tier) => {
        const price = variant.prices[tier];
        const margin = price - variant.cost_price;
        return (
          <Box
            key={tier}
            className="flex items-center justify-between gap-3 px-3 py-2"
          >
            <Box className="flex items-center gap-1.5">
              <Text as="span">{TIER_LABELS[tier]}</Text>
              {/* The reference marks the retail tier with a padlock. What it
                  locks is a form concern (§5), so it is decorative here. */}
              {tier === "public" ? (
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
                {price > 0 ? `${((margin / price) * 100).toFixed(1)}%` : "—"}
              </Badge>
              <Text
                as="span"
                className="font-medium tabular-nums"
              >
                {rupiah(price)}
              </Text>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

/** One card per variant, so the column lines up with the Variant cell. */
export function ProductPriceCell({ variants }: { variants: ProductVariant[] }) {
  return (
    <Box className="flex flex-col gap-2">
      {variants.map((variant) => (
        <VariantPriceCard
          key={variant.id}
          variant={variant}
        />
      ))}
    </Box>
  );
}
