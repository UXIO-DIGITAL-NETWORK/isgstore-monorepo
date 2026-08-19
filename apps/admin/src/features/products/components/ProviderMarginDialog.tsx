import { useState } from "react";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PRICE_TIERS, type PriceTier, type ProviderProduct } from "../types/product.type";
import { useSetProviderMargin } from "../hooks/useProviderProducts";

const TIER_LABELS: Record<PriceTier, string> = {
  public: "Public",
  vip: "VIP",
  reseller: "Reseller",
  agent: "Agent",
};

interface ProviderMarginDialogProps {
  provider: ProviderProduct;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Set per-tier profit margins for one provider product. The backend recomputes
 * the product's selling prices from cost using these percentages (an empty
 * field falls back to the pricing rules). Figma renders this as a page; a
 * dialog keeps the single-row edit inline while the bulk flow gets the page.
 */
export function ProviderMarginDialog({ provider, open, onOpenChange }: ProviderMarginDialogProps) {
  const setMargin = useSetProviderMargin();
  const [values, setValues] = useState<Record<PriceTier, string>>(() => ({
    public: provider.margins.public?.toString() ?? "",
    vip: provider.margins.vip?.toString() ?? "",
    reseller: provider.margins.reseller?.toString() ?? "",
    agent: provider.margins.agent?.toString() ?? "",
  }));

  const parse = (raw: string): number | null => {
    const trimmed = raw.trim();
    if (trimmed === "") return null;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : null;
  };

  const onSubmit = () => {
    setMargin.mutate(
      {
        id: provider.id,
        input: {
          margin_member: parse(values.public),
          margin_vip: parse(values.vip),
          margin_reseller: parse(values.reseller),
          margin_agent: parse(values.agent),
        },
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>Set Profit Margin</DialogTitle>
          <DialogDescription>
            Margin percent per tier for {provider.product_name}. Leave a field empty to use the pricing rules.
          </DialogDescription>
        </DialogHeader>

        <Box className="grid grid-cols-2 gap-4">
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

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={onSubmit} disabled={setMargin.isPending}>
            {setMargin.isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
        {setMargin.isPending && <Text variant="small">Recomputing prices…</Text>}
      </DialogContent>
    </Dialog>
  );
}
