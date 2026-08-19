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
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/utils/currency";
import type { Withdrawal } from "@/types/withdrawal.type";

import { useApproveWithdrawal } from "../hooks/useFinance";

const money = (v: number) => formatCurrency(v, { fractionDigits: 0 });

interface ApproveWithdrawalDialogProps {
  withdrawal: Withdrawal;
}

/**
 * Kita approves a pending withdrawal and the payout fires through Monetapay —
 * no bukti transfer, no manual step. The dialog confirms the beneficiary
 * details before the transfer because a disbursement can't be undone; on
 * confirm the row goes PROCESSING and settles asynchronously via webhook.
 */
export function ApproveWithdrawalDialog({ withdrawal }: ApproveWithdrawalDialogProps) {
  const [open, setOpen] = useState(false);
  const { mutate: approve, isPending } = useApproveWithdrawal();

  const onConfirm = () =>
    approve(
      { id: withdrawal.id },
      { onSuccess: () => setOpen(false) },
    );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Setujui</Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>Cairkan via Monetapay</DialogTitle>
          <DialogDescription>
            Dana akan langsung ditransfer ke rekening penerima melalui Monetapay. Aksi ini tidak dapat
            dibatalkan.
          </DialogDescription>
        </DialogHeader>

        <Box className="flex flex-col gap-2 rounded-lg bg-muted/50 px-4 py-3 text-sm">
          <Box className="flex justify-between gap-4">
            <Text as="span" className="text-muted-foreground">Merchant</Text>
            <Text as="span" className="font-medium">{withdrawal.merchant?.name ?? "-"}</Text>
          </Box>
          <Box className="flex justify-between gap-4">
            <Text as="span" className="text-muted-foreground">Diterima</Text>
            <Text as="span" className="font-medium tabular-nums">{money(withdrawal.nett)}</Text>
          </Box>
          <Box className="flex justify-between gap-4">
            <Text as="span" className="text-muted-foreground">Rekening</Text>
            <Text as="span" className="font-medium tabular-nums">
              {withdrawal.bank_code} · {withdrawal.account_number}
            </Text>
          </Box>
          <Box className="flex justify-between gap-4">
            <Text as="span" className="text-muted-foreground">Nama Pemilik</Text>
            <Text as="span" className="font-medium">{withdrawal.account_name}</Text>
          </Box>
        </Box>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button type="button" onClick={onConfirm} disabled={isPending}>
            {isPending ? "Memproses…" : "Setujui & Cairkan via Monetapay"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
