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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { paymentChannelSchema, type PaymentChannelFormValues } from "../schemas/paymentChannel.schema";
import type { PaymentChannel } from "../types/administration.type";

interface EditPaymentChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channel: PaymentChannel;
  onSubmit: (values: PaymentChannelFormValues) => void;
  isPending?: boolean;
}

const FIELDS = [
  { name: "fee_flat", label: "Flat Fee", placeholder: "e.g. 2500" },
  { name: "fee_percent", label: "Percentage Fee (%)", placeholder: "e.g. 1.5" },
  { name: "min_amount", label: "Minimum Amount", placeholder: "e.g. 10000" },
] as const;

/** Edits a channel's fee configuration (PRD §5). No native `min` — Zod owns validation. */
export function EditPaymentChannelDialog({ open, onOpenChange, channel, onSubmit, isPending = false }: EditPaymentChannelDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PaymentChannelFormValues>({
    resolver: zodResolver(paymentChannelSchema),
    defaultValues: {
      fee_flat: channel.fee_flat,
      fee_percent: channel.fee_percent,
      min_amount: channel.min_amount,
    },
  });

  useEffect(() => {
    if (open) reset({ fee_flat: channel.fee_flat, fee_percent: channel.fee_percent, min_amount: channel.min_amount });
  }, [open, channel, reset]);

  const submit = (values: PaymentChannelFormValues) => {
    onSubmit(values);
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
            <DialogTitle>Edit {channel.name}</DialogTitle>
            <DialogDescription>Configure the fees and minimum charged for this channel.</DialogDescription>
          </DialogHeader>

          {FIELDS.map((f) => (
            <Box
              key={f.name}
              className="flex flex-col gap-1.5"
            >
              <Label htmlFor={`channel-${f.name}`}>{f.label}</Label>
              <Input
                id={`channel-${f.name}`}
                type="number"
                step="any"
                className="rounded-xl"
                placeholder={f.placeholder}
                {...register(f.name, { valueAsNumber: true })}
              />
              {errors[f.name] && (
                <Text
                  variant="small"
                  className="text-destructive"
                >
                  {errors[f.name]?.message}
                </Text>
              )}
            </Box>
          ))}

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
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
