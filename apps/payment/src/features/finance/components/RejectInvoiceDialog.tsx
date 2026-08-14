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
import { Textarea } from "@/components/ui/textarea";
import type { ServiceInvoice } from "@/types/service.type";

import { useRejectServiceInvoice } from "../hooks/useFinance";

interface RejectInvoiceDialogProps {
  invoice: ServiceInvoice;
}

/** Refuses the bukti transfer. The client may correct it and upload again. */
export function RejectInvoiceDialog({ invoice }: RejectInvoiceDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const { mutate: reject, isPending } = useRejectServiceInvoice();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setReason("");
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">Tolak</Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>Tolak Pembayaran</DialogTitle>
          <DialogDescription>
            Client bisa memperbaiki dan mengunggah ulang. Instalasi yang sudah disiapkan tetap disimpan.
          </DialogDescription>
        </DialogHeader>

        <Box className="flex flex-col gap-4">
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
              onClick={() => setOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              disabled={isPending}
              onClick={() =>
                reject(
                  { id: invoice.id, reason: reason || undefined },
                  {
                    onSuccess: () => {
                      setReason("");
                      setOpen(false);
                    },
                  },
                )
              }
            >
              {isPending ? "Menyimpan…" : "Tolak"}
            </Button>
          </DialogFooter>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
