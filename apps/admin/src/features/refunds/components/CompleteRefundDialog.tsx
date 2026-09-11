import { useTranslation } from "react-i18next";
import { useRef, useState } from "react";
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
import { formatCurrency } from "@/utils/currency";
import { completeRefundSchema, type CompleteRefundFormValues } from "../schemas/refund.schema";
import type { Refund } from "../types/refund.type";

interface CompleteRefundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  refund: Refund;
  onConfirm: (input: { proof?: File | null; note?: string }) => void;
  isPending?: boolean;
}

/**
 * "I have made the transfer." Irreversible in the real world, so the dialog
 * restates the amount and the destination rather than just asking to confirm —
 * the numbers are what the admin should be checking against their banking app.
 *
 * The proof file is optional and is uploaded exactly as picked: proof is
 * evidence, so it does not go through the WebP re-encode every other image
 * upload in this app does.
 */
export function CompleteRefundDialog({ open, onOpenChange, refund, onConfirm, isPending = false }: CompleteRefundDialogProps) {
  const { t } = useTranslation("refunds");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [proof, setProof] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CompleteRefundFormValues>({
    resolver: zodResolver(completeRefundSchema),
    defaultValues: { note: "" },
  });

  // Cleared on close rather than on open: the dialog is mounted once per table
  // row and reused, so a previous attempt's note and file must not survive —
  // and resetting here keeps it out of an effect, which would be a setState
  // during render for the file.
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      reset({ note: "" });
      setProof(null);
    }
    onOpenChange(next);
  };

  const onSubmit = (values: CompleteRefundFormValues) => {
    onConfirm({ proof, note: values.note });
    handleOpenChange(false);
  };

  const destination = refund.payout
    ? `${refund.payout.bank_name ?? refund.payout.bank_code} · ${refund.payout.account_number ?? refund.payout.account_phone ?? "—"} · ${refund.payout.account_name ?? ""}`
    : "No payout account on file";

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogContent>
        <Box
          as="form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <DialogHeader>
            <DialogTitle>Mark {refund.refund_number} as transferred?</DialogTitle>
            <DialogDescription>{t("completeHint")}</DialogDescription>
          </DialogHeader>

          <Box className="border-border flex flex-col gap-1 rounded-xl border p-3">
            <Text
              as="span"
              className="text-lg font-semibold tabular-nums"
            >
              {formatCurrency(refund.amount, { fractionDigits: 0 })}
            </Text>
            <Text
              variant="muted"
              as="span"
            >
              {destination}
            </Text>
          </Box>

          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="refund-proof">{t("transferReceiptOptional")}</Label>
            <input
              ref={fileInputRef}
              id="refund-proof"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={(event) => setProof(event.target.files?.[0] ?? null)}
            />
            <Box className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => fileInputRef.current?.click()}
              >{t("browseFiles")}</Button>
              <Text
                variant="muted"
                as="span"
              >
                {proof ? proof.name : "JPG, PNG or PDF up to 2mb"}
              </Text>
            </Box>
          </Box>

          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="refund-note">{t("noteOptional")}</Label>
            <Input
              id="refund-note"
              className="rounded-xl"
              placeholder={t("completePlaceholder")}
              {...register("note")}
            />
            {errors.note && (
              <Text
                variant="small"
                className="text-destructive"
              >
                {errors.note.message}
              </Text>
            )}
          </Box>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => handleOpenChange(false)}
            >{t("cancel")}</Button>
            <Button
              type="submit"
              className="rounded-xl"
              disabled={isPending}
            >
              {isPending ? "Completing..." : "Mark as transferred"}
            </Button>
          </DialogFooter>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
