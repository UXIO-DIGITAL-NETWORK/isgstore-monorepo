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
import { refundSchema, type RefundFormValues } from "../schemas/refund.schema";

interface RefundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceNo: string;
  /** Fires only on a valid submit — never on open — carrying the required reason. */
  onConfirm: (reason: string) => void;
  isPending?: boolean;
}

/**
 * Confirmation gate for the "Refund" row action (product_requirements.md §4.3).
 * Unlike the Delete dialog this collects a required reason, so it's a real form
 * (RHF + Zod) rather than a bare AlertDialog — the reason is passed straight to
 * `transactionsService.refund`, which also rejects an empty string.
 */
export function RefundDialog({ open, onOpenChange, invoiceNo, onConfirm, isPending = false }: RefundDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RefundFormValues>({
    resolver: zodResolver(refundSchema),
    defaultValues: { reason: "" },
  });

  // Mounted once per table row and reused across opens, so the reason from a
  // previous open must be cleared — same reset-on-open concern the Edit modal
  // used to carry before it became a route.
  useEffect(() => {
    if (open) reset({ reason: "" });
  }, [open, reset]);

  const onSubmit = (values: RefundFormValues) => {
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
            <DialogTitle>Refund transaction {invoiceNo}?</DialogTitle>
            <DialogDescription>
              A registered member is credited to their balance immediately. A guest is queued on the Refunds page for a
              manual transfer. Provide a reason for the audit trail.
            </DialogDescription>
          </DialogHeader>

          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="refund-reason">Reason</Label>
            <Textarea
              id="refund-reason"
              className="rounded-xl"
              placeholder="e.g. Item out of stock at supplier"
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
              className="rounded-xl dark:bg-destructive"
              disabled={isPending}
            >
              {isPending ? "Refunding..." : "Refund"}
            </Button>
          </DialogFooter>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
