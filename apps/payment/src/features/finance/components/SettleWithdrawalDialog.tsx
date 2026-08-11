import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Box } from "@/components/common/Box";
import { ImageDropzone } from "@/components/common/ImageDropzone";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/utils/currency";
import type { Withdrawal } from "@/types/withdrawal.type";

import { useApproveWithdrawal } from "../hooks/useFinance";
import {
  settleWithdrawalSchema,
  type SettleWithdrawalFormValues,
} from "../schemas/settleWithdrawal.schema";

const money = (v: number) => formatCurrency(v, { fractionDigits: 0 });

interface SettleWithdrawalDialogProps {
  withdrawal: Withdrawal;
}

/**
 * Kita settles a pending withdrawal manually: upload the bukti transfer
 * (transfer receipt) and the payout is marked SETTLED. Proof is required — the
 * dialog is the only way to approve, so a settlement can never lack its receipt.
 */
export function SettleWithdrawalDialog({ withdrawal }: SettleWithdrawalDialogProps) {
  const [open, setOpen] = useState(false);
  const { mutate: approve, isPending } = useApproveWithdrawal();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SettleWithdrawalFormValues>({ resolver: zodResolver(settleWithdrawalSchema) });

  const onSubmit = (values: SettleWithdrawalFormValues) =>
    approve(
      { id: withdrawal.id, method: "manual", proof: values.proof },
      {
        onSuccess: () => {
          reset();
          setOpen(false);
        },
      },
    );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">Setujui</Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>Setujui Penarikan</DialogTitle>
          <DialogDescription>
            Unggah bukti transfer ke {withdrawal.merchant?.name ?? "merchant"} sebesar{" "}
            {money(withdrawal.nett)} ke {withdrawal.bank_code} · {withdrawal.account_number}.
          </DialogDescription>
        </DialogHeader>

        <Box
          as="form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <Controller
            control={control}
            name="proof"
            render={({ field }) => (
              <ImageDropzone
                id={`proof-${withdrawal.id}`}
                label="Bukti Transfer"
                caption="Wajib. Lampirkan struk/tangkapan layar transfer ke rekening merchant."
                value={field.value}
                onChange={field.onChange}
                error={errors.proof?.message}
                accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                formatsLabel="JPG, PNG, WEBP, atau PDF hingga 4MB"
              />
            )}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isPending}
            >
              {isPending ? "Menyimpan…" : "Setujui & Kirim Bukti"}
            </Button>
          </DialogFooter>
          {isPending && <Text variant="small">Mengunggah bukti transfer…</Text>}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
