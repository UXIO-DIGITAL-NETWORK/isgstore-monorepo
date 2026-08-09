import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Box } from "@/components/common/Box";
import { SelectField } from "@/components/common/SelectField";
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
import { pricingRuleSchema, type PricingRuleFormValues } from "../schemas/pricingRule.schema";
import type { CategoryOption, PricingRule, PricingRuleInput } from "../types/pricingRule.type";

interface PricingRuleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: PricingRule | null;
  categoryOptions: CategoryOption[];
  onSubmit: (input: PricingRuleInput) => void;
  isPending?: boolean;
}

const ROLE_OPTIONS = [
  { value: "member", label: "Member" },
  { value: "vip", label: "VIP" },
  { value: "reseller", label: "Reseller" },
  { value: "agent", label: "Agent" },
];

// Radix Select forbids an empty-string item value, so the global rule uses a
// sentinel that maps back to `category_id: null` on submit.
const GLOBAL_VALUE = "__global__";
const GLOBAL = { value: GLOBAL_VALUE, label: "All categories (global)" };

export function PricingRuleFormDialog({ open, onOpenChange, rule, categoryOptions, onSubmit, isPending = false }: PricingRuleFormDialogProps) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PricingRuleFormValues>({
    resolver: zodResolver(pricingRuleSchema),
    defaultValues: { category_id: GLOBAL_VALUE, role: "member", markup_percent: 0, markup_flat: 0 },
  });

  useEffect(() => {
    if (!open) return;
    reset(
      rule
        ? {
            category_id: rule.category_id !== null ? String(rule.category_id) : GLOBAL_VALUE,
            role: rule.role,
            markup_percent: rule.markup_percent,
            markup_flat: rule.markup_flat,
          }
        : { category_id: GLOBAL_VALUE, role: "member", markup_percent: 0, markup_flat: 0 },
    );
  }, [open, rule, reset]);

  const submit = (values: PricingRuleFormValues) => {
    onSubmit({
      category_id: values.category_id === GLOBAL_VALUE ? null : Number(values.category_id),
      role: values.role,
      markup_percent: values.markup_percent,
      markup_flat: values.markup_flat,
    });
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        <Box
          as="form"
          onSubmit={handleSubmit(submit)}
          className="flex flex-col gap-4"
        >
          <DialogHeader>
            <DialogTitle>{rule ? "Edit Pricing Rule" : "Add Pricing Rule"}</DialogTitle>
            <DialogDescription>
              Sets the markup applied over supplier cost for a role. Price = ⌈cost × (1 + %/100)⌉ + flat.
            </DialogDescription>
          </DialogHeader>

          <Controller
            control={control}
            name="role"
            render={({ field }) => (
              <SelectField
                id="rule-role"
                label="Role"
                options={ROLE_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                error={errors.role?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="category_id"
            render={({ field }) => (
              <SelectField
                id="rule-category"
                label="Category"
                options={[GLOBAL, ...categoryOptions]}
                value={field.value}
                onChange={field.onChange}
                placeholder="All categories (global)"
              />
            )}
          />

          <Box className="grid grid-cols-2 gap-3">
            <Box className="flex flex-col gap-1.5">
              <Label htmlFor="rule-percent">Markup %</Label>
              <Input
                id="rule-percent"
                type="number"
                step="any"
                className="rounded-xl"
                placeholder="e.g. 20"
                {...register("markup_percent", { valueAsNumber: true })}
              />
              {errors.markup_percent && (
                <Text
                  variant="small"
                  className="text-destructive"
                >
                  {errors.markup_percent.message}
                </Text>
              )}
            </Box>
            <Box className="flex flex-col gap-1.5">
              <Label htmlFor="rule-flat">Flat markup</Label>
              <Input
                id="rule-flat"
                type="number"
                className="rounded-xl"
                placeholder="e.g. 500"
                {...register("markup_flat", { valueAsNumber: true })}
              />
              {errors.markup_flat && (
                <Text
                  variant="small"
                  className="text-destructive"
                >
                  {errors.markup_flat.message}
                </Text>
              )}
            </Box>
          </Box>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-xl"
              disabled={isPending}
            >
              {isPending ? "Saving..." : rule ? "Save" : "Add Rule"}
            </Button>
          </DialogFooter>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
