import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductPriceCell } from "../components/ProductPriceCell";
import { useBulkSetProviderMargin, useProviderProductList } from "../hooks/useProviderProducts";
import { PRICE_TIERS, type PriceTier } from "../types/product.type";

const TIER_LABELS: Record<PriceTier, string> = {
  public: "Public",
  vip: "VIP",
  reseller: "Reseller",
  agent: "Agent",
};

/**
 * Set Profit Margin (Bulk) — applies one set of per-tier margins to every
 * selected provider product. The left column stacks the selected items with
 * their price breakdown; the right form is applied to all. Selection is passed
 * as `?ids=1,2` so the page is linkable and survives a refresh.
 */
export default function ProviderMarginBulkPage({ ids }: { ids: string[] }) {
  const navigate = useNavigate();
  const bulkMargin = useBulkSetProviderMargin();
  const [values, setValues] = useState<Record<PriceTier, string>>({
    public: "",
    vip: "",
    reseller: "",
    agent: "",
  });
  // The selling-price window travels with the margin: both are decided here,
  // and promote carries them onto the product together.
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  // Ask for exactly the selection. This used to pull one page and filter it in
  // the browser, which silently dropped any row that fell outside the first 100.
  const { data, isLoading } = useProviderProductList({
    ids: ids.join(","),
    per_page: Math.max(ids.length, 1),
  });
  const selected = useMemo(() => data?.data ?? [], [data]);
  // The selection size is known from the URL, so show exactly that many skeleton
  // cards (clamped) — a large bulk selection shouldn't stretch the column.
  const skeletonCount = Math.min(Math.max(ids.length, 1), 8);

  const parse = (raw: string): number | null => {
    const trimmed = raw.trim();
    if (trimmed === "") return null;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : null;
  };

  const backToList = () => navigate({ to: "/admin/products/provider" });

  const onSubmit = () =>
    bulkMargin.mutate(
      {
        ids,
        input: {
          margin_member: parse(values.public),
          margin_vip: parse(values.vip),
          margin_reseller: parse(values.reseller),
          margin_agent: parse(values.agent),
          price_min: parse(priceMin),
          price_max: parse(priceMax),
        },
      },
      { onSuccess: backToList },
    );

  return (
    <Box className="flex flex-col gap-6">
      <Box className="rounded-2xl border border-border bg-card p-6">
        <Heading level={1} variant="section">
          Set Profit Margin
        </Heading>
        <Text variant="muted">
          Set the selling price for {ids.length} provider product{ids.length === 1 ? "" : "s"}. Leave a margin empty to
          use the pricing rules. Saving here is what unlocks Promote — a SKU cannot reach the catalogue unpriced.
        </Text>
      </Box>

      <Box className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Box className="flex flex-col gap-3">
          {isLoading ? (
            Array.from({ length: skeletonCount }).map((_, index) => (
              <Box key={`skeleton-${index}`} className="rounded-2xl border border-border bg-card p-4">
                <Box className="flex flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-4 w-56" />
                </Box>
                <Skeleton className="mt-3 h-12 w-full" />
              </Box>
            ))
          ) : selected.length === 0 ? (
            <Box className="rounded-2xl border border-border bg-card p-6">
              <Text variant="muted">No selected products to show.</Text>
            </Box>
          ) : (
            selected.map((row) => (
              <Box key={row.id} className="rounded-2xl border border-border bg-card p-4">
                <Box className="flex flex-col gap-0.5">
                  <Text as="span" variant="small">
                    {row.category_name} · {row.product_code}
                  </Text>
                  <Text as="span" className="font-medium">
                    {row.product_name}
                  </Text>
                </Box>
                <Box className="mt-3">
                  <ProductPriceCell variants={[row.variant]} />
                </Box>
              </Box>
            ))
          )}
        </Box>

        <Box className="h-fit rounded-2xl border border-border bg-card p-6">
          <Box className="grid grid-cols-1 gap-4">
            {PRICE_TIERS.map((tier) => (
              <Box key={tier} className="flex flex-col gap-1.5">
                <Label htmlFor={`margin-${tier}`}>{TIER_LABELS[tier]} margin (%)</Label>
                <Input
                  id={`margin-${tier}`}
                  type="number"
                  step="0.01"
                  value={values[tier]}
                  onChange={(e) => setValues((prev) => ({ ...prev, [tier]: e.target.value }))}
                  placeholder="0"
                />
              </Box>
            ))}
          </Box>
          <Box className="mt-4 grid grid-cols-1 gap-4 border-t border-border pt-4">
            <Box className="flex flex-col gap-1.5">
              <Label htmlFor="price-min">Lower Price Limit (Min)</Label>
              <Input
                id="price-min"
                type="number"
                min="0"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                placeholder="Rp 0"
              />
              <Text variant="small" className="text-muted-foreground">
                0 = no limit
              </Text>
            </Box>
            <Box className="flex flex-col gap-1.5">
              <Label htmlFor="price-max">Upper Price Limit (Max)</Label>
              <Input
                id="price-max"
                type="number"
                min="0"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                placeholder="Rp 0"
              />
              <Text variant="small" className="text-muted-foreground">
                0 = no limit
              </Text>
            </Box>
          </Box>

          <Box className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={backToList}>
              Cancel
            </Button>
            <Button type="button" onClick={onSubmit} disabled={bulkMargin.isPending || ids.length === 0}>
              {bulkMargin.isPending ? "Saving…" : "Save"}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
