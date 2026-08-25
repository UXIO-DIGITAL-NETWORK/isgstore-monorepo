import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
import { Switch } from "@/components/ui/switch";
import { membershipPlanSchema, type MembershipPlanFormValues } from "../schemas/membershipPlan.schema";
import type { MembershipPlan, MembershipPlanInput } from "../types/membership.type";

interface MembershipPlanFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode; absent = add mode. */
  plan?: MembershipPlan | null;
  onSubmit: (values: MembershipPlanInput) => void;
  isPending?: boolean;
}

// Lifetime is the default: every plan sold today is one, and a new plan that
// silently expires after 30 days would be the surprising outcome.
const EMPTY: MembershipPlanFormValues = {
  code: "",
  name: "",
  price: 0,
  is_lifetime: true,
  duration_days: null,
  is_active: true,
};

export function MembershipPlanFormDialog({ open, onOpenChange, plan, onSubmit, isPending = false }: MembershipPlanFormDialogProps) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MembershipPlanFormValues>({
    resolver: zodResolver(membershipPlanSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (!open) return;
    reset(
      plan
        ? {
            code: plan.code,
            name: plan.name,
            price: plan.price,
            is_lifetime: plan.duration_days === null,
            duration_days: plan.duration_days,
            is_active: plan.is_active,
          }
        : EMPTY,
    );
  }, [open, plan, reset]);

  // useWatch, not watch(): the subscription is scoped to this one field, and
  // React Compiler cannot memoize around watch()'s returned function.
  const isLifetime = useWatch({ control, name: "is_lifetime" });

  const submit = ({ is_lifetime, duration_days, ...rest }: MembershipPlanFormValues) => {
    onSubmit({ ...rest, duration_days: is_lifetime ? null : duration_days });
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
            <DialogTitle>{plan ? "Edit Plan" : "Add Plan"}</DialogTitle>
            <DialogDescription>Loyalty plan sold to members: its price and how long it lasts.</DialogDescription>
          </DialogHeader>

          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="plan-code">Code</Label>
            <Input
              id="plan-code"
              className="rounded-xl"
              placeholder="e.g. gold"
              {...register("code")}
            />
            {errors.code && (
              <Text
                variant="small"
                className="text-destructive"
              >
                {errors.code.message}
              </Text>
            )}
          </Box>

          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="plan-name">Name</Label>
            <Input
              id="plan-name"
              className="rounded-xl"
              placeholder="e.g. Gold"
              {...register("name")}
            />
            {errors.name && (
              <Text
                variant="small"
                className="text-destructive"
              >
                {errors.name.message}
              </Text>
            )}
          </Box>

          <Box className="grid grid-cols-2 gap-3">
            <Box className="flex flex-col gap-1.5">
              <Label htmlFor="plan-price">Price</Label>
              <Input
                id="plan-price"
                type="number"
                className="rounded-xl"
                placeholder="e.g. 50000"
                {...register("price", { valueAsNumber: true })}
              />
              {errors.price && (
                <Text
                  variant="small"
                  className="text-destructive"
                >
                  {errors.price.message}
                </Text>
              )}
            </Box>
            <Box className="flex flex-col gap-1.5">
              <Label htmlFor="plan-duration">Duration (days)</Label>
              <Input
                id="plan-duration"
                type="number"
                className="rounded-xl"
                placeholder="e.g. 30"
                disabled={isLifetime}
                {...register("duration_days", {
                  // A cleared or disabled number input reads back NaN, which is
                  // not the same thing as "no expiry" — normalise it to null so
                  // the schema and the API agree.
                  setValueAs: (value) => (value === "" || Number.isNaN(Number(value)) ? null : Number(value)),
                })}
              />
              {errors.duration_days && (
                <Text
                  variant="small"
                  className="text-destructive"
                >
                  {errors.duration_days.message}
                </Text>
              )}
            </Box>
          </Box>

          <Controller
            control={control}
            name="is_lifetime"
            render={({ field }) => (
              <Box className="flex items-center gap-3">
                <Switch
                  id="plan-lifetime"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <Box className="flex flex-col">
                  <Label htmlFor="plan-lifetime">Lifetime</Label>
                  <Text
                    variant="small"
                    className="text-muted-foreground"
                  >
                    Bought once and never expires — the duration above is ignored.
                  </Text>
                </Box>
              </Box>
            )}
          />

          <Controller
            control={control}
            name="is_active"
            render={({ field }) => (
              <Box className="flex items-center gap-3">
                <Switch
                  id="plan-active"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <Label htmlFor="plan-active">Active</Label>
              </Box>
            )}
          />

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
              {isPending ? "Saving..." : plan ? "Save" : "Add Plan"}
            </Button>
          </DialogFooter>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
