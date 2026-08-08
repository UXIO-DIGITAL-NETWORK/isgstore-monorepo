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
import { Textarea } from "@/components/ui/textarea";
import {
  balanceAdjustmentSchema,
  type BalanceAdjustmentFormValues,
} from "../schemas/balanceAdjustment.schema";
import type { BalanceAdjustmentInput } from "../types/administration.type";

interface AdjustBalanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  onConfirm: (input: BalanceAdjustmentInput) => void;
  isPending?: boolean;
}

const DIRECTION_OPTIONS = [
  { value: "credit", label: "Credit (add funds)" },
  { value: "debit", label: "Debit (remove funds)" },
];

/**
 * Audited manual wallet adjustment (PRD §5). A reason is mandatory and the
 * amount must be positive — the direction, not a sign, decides credit vs debit.
 */
export function AdjustBalanceDialog({ open, onOpenChange, userName, onConfirm, isPending = false }: AdjustBalanceDialogProps) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BalanceAdjustmentFormValues>({
    resolver: zodResolver(balanceAdjustmentSchema),
    defaultValues: { direction: "credit", amount: undefined, reason: "" },
  });

  useEffect(() => {
    if (open) reset({ direction: "credit", amount: undefined, reason: "" });
  }, [open, reset]);

  const onSubmit = (values: BalanceAdjustmentFormValues) => {
    onConfirm({ amount: values.amount, direction: values.direction, reason: values.reason.trim() });
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
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <DialogHeader>
            <DialogTitle>Adjust balance — {userName}</DialogTitle>
            <DialogDescription>
              This moves money in the customer's wallet. The reason is recorded in the audit trail.
            </DialogDescription>
          </DialogHeader>

          <Controller
            control={control}
            name="direction"
            render={({ field }) => (
              <SelectField
                id="adjust-direction"
                label="Direction"
                options={DIRECTION_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                error={errors.direction?.message}
              />
            )}
          />

          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="adjust-amount">Amount</Label>
            {/* No native `min` — a browser constraint would block the whole
                form submit before Zod ever runs, so the "must be > 0" message
                would never render. The schema owns that rule instead. */}
            <Input
              id="adjust-amount"
              type="number"
              className="rounded-xl"
              placeholder="e.g. 50000"
              {...register("amount", { valueAsNumber: true })}
            />
            {errors.amount && (
              <Text
                variant="small"
                className="text-destructive"
              >
                {errors.amount.message}
              </Text>
            )}
          </Box>

          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="adjust-reason">Reason</Label>
            <Textarea
              id="adjust-reason"
              className="rounded-xl"
              placeholder="e.g. Compensation for failed order INV-001"
              {...register("reason")}
            />
            {errors.reason && (
              <Text
                variant="small"
                className="text-destructive"
              >
                {errors.reason.message}
              </Text>
            )}
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
              {isPending ? "Saving..." : "Adjust Balance"}
            </Button>
          </DialogFooter>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
