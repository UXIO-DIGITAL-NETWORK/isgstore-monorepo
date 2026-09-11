import { useTranslation } from "react-i18next";
import { useState } from "react";

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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatCurrency } from "@/utils/currency";
import type { Withdrawal } from "@/types/withdrawal.type";

import { useApproveWithdrawal } from "../hooks/useFinance";

const money = (v: number) => formatCurrency(v, { fractionDigits: 0 });

interface ApproveWithdrawalDialogProps {
  withdrawal: Withdrawal;
  /**
   * Offer the manual transfer path alongside Monetapay. Only "Verifikasi
   * Penarikan Internal" passes this — merchant payouts stay Monetapay-only,
   * unchanged from before this prop existed.
   */
  allowManual?: boolean;
}

/**
 * Kita approves a pending withdrawal. Monetapay (the default, and the only
 * option unless `allowManual`) fires the payout through the gateway — the
 * dialog confirms the beneficiary details first because a disbursement can't
 * be undone; on confirm the row goes PROCESSING and settles asynchronously
 * via webhook. The manual path settles immediately once a bukti transfer is
 * attached, for a transfer kita already made out-of-band.
 */
export function ApproveWithdrawalDialog({ withdrawal, allowManual = false }: ApproveWithdrawalDialogProps) {
  const { t } = useTranslation("finance");
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<"manual" | "monetapay">("monetapay");
  const [proof, setProof] = useState<File | undefined>(undefined);
  const [proofError, setProofError] = useState<string | undefined>(undefined);
  const { mutate: approve, isPending } = useApproveWithdrawal();

  const onConfirm = () => {
    if (allowManual && method === "manual" && !proof) {
      setProofError(t("approveWithdrawal.proofRequired"));
      return;
    }

    approve(
      { id: withdrawal.id, method, proof: method === "manual" ? proof : undefined },
      {
        onSuccess: () => {
          setOpen(false);
          setMethod("monetapay");
          setProof(undefined);
          setProofError(undefined);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">{t("approveWithdrawal.trigger")}</Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>{method === "manual" ? t("approveWithdrawal.titleManual") : t("approveWithdrawal.titleMonetapay")}</DialogTitle>
          <DialogDescription>
            {method === "manual"
              ? t("approveWithdrawal.descriptionManual")
              : t("approveWithdrawal.descriptionMonetapay")}
          </DialogDescription>
        </DialogHeader>

        {allowManual && (
          <RadioGroup
            value={method}
            onValueChange={(v) => setMethod(v as "manual" | "monetapay")}
            className="flex gap-4"
          >
            <Box className="flex items-center gap-2">
              <RadioGroupItem value="monetapay" id="method-monetapay" />
              <Label htmlFor="method-monetapay">{t("approveWithdrawal.methodMonetapay")}</Label>
            </Box>
            <Box className="flex items-center gap-2">
              <RadioGroupItem value="manual" id="method-manual" />
              <Label htmlFor="method-manual">{t("approveWithdrawal.methodManual")}</Label>
            </Box>
          </RadioGroup>
        )}

        <Box className="flex flex-col gap-2 rounded-lg bg-muted/50 px-4 py-3 text-sm">
          <Box className="flex justify-between gap-4">
            <Text as="span" className="text-muted-foreground">
              {withdrawal.merchant ? t("approveWithdrawal.merchant") : t("approveWithdrawal.requester")}
            </Text>
            <Text as="span" className="font-medium">
              {withdrawal.merchant?.name ?? withdrawal.requester?.name ?? "-"}
            </Text>
          </Box>
          <Box className="flex justify-between gap-4">
            <Text as="span" className="text-muted-foreground">{t("approveWithdrawal.received")}</Text>
            <Text as="span" className="font-medium tabular-nums">{money(withdrawal.nett)}</Text>
          </Box>
          <Box className="flex justify-between gap-4">
            <Text as="span" className="text-muted-foreground">{t("approveWithdrawal.account")}</Text>
            <Text as="span" className="font-medium tabular-nums">
              {withdrawal.bank_code} · {withdrawal.account_number}
            </Text>
          </Box>
          <Box className="flex justify-between gap-4">
            <Text as="span" className="text-muted-foreground">{t("approveWithdrawal.accountName")}</Text>
            <Text as="span" className="font-medium">{withdrawal.account_name}</Text>
          </Box>
        </Box>

        {allowManual && method === "manual" && (
          <ImageDropzone
            id="proof"
            label={t("approveWithdrawal.proofLabel")}
            caption={t("approveWithdrawal.proofCaption")}
            value={proof}
            onChange={(file) => {
              setProof(file);
              setProofError(undefined);
            }}
            error={proofError}
          />
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            {t("approveWithdrawal.cancel")}
          </Button>
          <Button type="button" onClick={onConfirm} disabled={isPending}>
            {isPending
              ? t("approveWithdrawal.submitting")
              : method === "manual"
                ? t("approveWithdrawal.submitManual")
                : t("approveWithdrawal.submitMonetapay")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
