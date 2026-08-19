import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  // The list has no id filter, so pull a page and narrow to the selection.
  const { data } = useProviderProductList({ per_page: 100 });
  const selected = useMemo(
    () => (data?.data ?? []).filter((row) => ids.includes(row.id)),
    [data, ids],
  );

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
          Apply per-tier margins to {ids.length} selected provider product{ids.length === 1 ? "" : "s"}. Leave a field
          empty to use the pricing rules.
        </Text>
      </Box>

      <Box className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Box className="flex flex-col gap-3">
          {selected.map((row) => (
            <Box key={row.id} className="rounded-2xl border border-border bg-card p-4">
              <Text as="span" variant="muted">
                {row.category_name} · {row.product_code}
              </Text>
              <Text as="span" className="font-medium">
                {row.product_name}
              </Text>
              <Box className="mt-3">
                <ProductPriceCell variants={[row.variant]} />
              </Box>
            </Box>
          ))}
          {selected.length === 0 && (
            <Box className="rounded-2xl border border-border bg-card p-6">
              <Text variant="muted">No selected products to show.</Text>
            </Box>
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
