import { useState } from "react";

import { Box } from "@/components/common/Box";
import { Image } from "@/components/common/Image";
import { Link } from "@/components/common/Link";
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
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/utils/currency";
import type { ServiceInvoice } from "@/types/service.type";

import { useConfirmServiceInvoice, useRejectServiceInvoice } from "../hooks/useFinance";

const money = (v: number) => formatCurrency(v, { fractionDigits: 0 });

interface ConfirmServiceInvoiceDialogProps {
  invoice: ServiceInvoice;
}

/**
 * The mirror image of SettleWithdrawalDialog: there kita uploads a bukti
 * transfer, here kita reads the one a client uploaded and decides.
 *
 * Confirming is what opens the subscription period, so the proof is shown
 * inline — approving without looking at it should take deliberate effort.
 */
export function ConfirmServiceInvoiceDialog({ invoice }: ConfirmServiceInvoiceDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const { mutate: confirm, isPending: confirming } = useConfirmServiceInvoice();
  const { mutate: reject, isPending: rejecting } = useRejectServiceInvoice();

  const close = () => {
    setReason("");
    setOpen(false);
  };

  const isPdf = invoice.proof_url?.toLowerCase().endsWith(".pdf") ?? false;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setReason("");
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">Periksa</Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>Konfirmasi Pembayaran</DialogTitle>
          <DialogDescription>
            {invoice.merchant?.name ?? "Client"} membayar {invoice.service_name} sebesar {money(invoice.amount)} untuk{" "}
            {invoice.duration_days} hari. Periksa bukti transfer sebelum mengkonfirmasi.
          </DialogDescription>
        </DialogHeader>

        <Box className="flex flex-col gap-4">
          {invoice.proof_url ? (
            isPdf ? (
              <Link
                href={invoice.proof_url}
                target="_blank"
                rel="noreferrer"
                className="text-sm underline"
              >
                Buka bukti transfer (PDF)
              </Link>
            ) : (
              <Link
                href={invoice.proof_url}
                target="_blank"
                rel="noreferrer"
              >
                <Image
                  src={invoice.proof_url}
                  alt={`Bukti transfer ${invoice.invoice_number}`}
                  className="max-h-72 w-full rounded-xl border border-border object-contain"
                />
              </Link>
            )
          ) : (
            <Text
              variant="small"
              className="text-muted-foreground"
            >
              Belum ada bukti transfer.
            </Text>
          )}

          <Box className="flex flex-col gap-1.5">
            <Text
              as="span"
              variant="small"
              className="text-muted-foreground"
            >
              Alasan penolakan (opsional, dikirim ke client)
            </Text>
            <Textarea
              aria-label="Alasan penolakan"
              rows={2}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </Box>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={rejecting || confirming}
              onClick={() => reject({ id: invoice.id, reason: reason || undefined }, { onSuccess: close })}
            >
              Tolak
            </Button>
            <Button
              type="button"
              disabled={confirming || rejecting}
              onClick={() => confirm(invoice.id, { onSuccess: close })}
            >
              {confirming ? "Menyimpan…" : "Konfirmasi"}
            </Button>
          </DialogFooter>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
