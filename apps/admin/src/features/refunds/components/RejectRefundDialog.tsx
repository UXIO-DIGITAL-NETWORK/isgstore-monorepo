import { useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { rejectRefundSchema, type RejectRefundFormValues } from "../schemas/refund.schema";

interface RejectRefundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  refundNumber: string;
  onConfirm: (reason: string) => void;
  isPending?: boolean;
}

/**
 * Refusing to return someone's money. The reason is mandatory — this is the
 * one action whose justification someone will go looking for later — and the
 * API enforces the same, so the form gate catches it before the mutation.
 */
export function RejectRefundDialog({ open, onOpenChange, refundNumber, onConfirm, isPending = false }: RejectRefundDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RejectRefundFormValues>({
    resolver: zodResolver(rejectRefundSchema),
    defaultValues: { reason: "" },
  });

  useEffect(() => {
    if (open) reset({ reason: "" });
  }, [open, reset]);

  const onSubmit = (values: RejectRefundFormValues) => {
    onConfirm(values.reason.trim());
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
            <DialogTitle>Reject refund {refundNumber}?</DialogTitle>
            <DialogDescription>
              No money moves and the sale still stands. The claim link stops working, so the customer cannot submit
              payout details afterwards.
            </DialogDescription>
          </DialogHeader>

          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="reject-reason">Reason</Label>
            <Textarea
              id="reject-reason"
              className="rounded-xl"
              placeholder="e.g. Duplicate claim — already refunded under RFD-…"
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
              variant="destructive"
              className="dark:bg-destructive rounded-xl"
              disabled={isPending}
            >
              {isPending ? "Rejecting..." : "Reject refund"}
            </Button>
          </DialogFooter>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
