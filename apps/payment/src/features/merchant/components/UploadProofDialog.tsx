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
import type { ServiceInvoice } from "@/types/service.type";

import { useUploadServiceProof } from "../hooks/useMerchant";
import { uploadProofSchema, type UploadProofFormValues } from "../schemas/uploadProof.schema";

const money = (v: number) => formatCurrency(v, { fractionDigits: 0 });

interface UploadProofDialogProps {
  invoice: ServiceInvoice;
  /**
   * Fired after a successful upload, once the dialog has closed. Each mount
   * point decides where the client lands — the dialog itself stays free of
   * router imports so the pages hosting it remain bare-renderable in tests.
   */
  onUploaded?: () => void;
}

/**
 * The client attaches its bukti transfer to a service invoice. Available from
 * UNPAID and from REJECTED, so a refused proof can be corrected.
 */
export function UploadProofDialog({ invoice, onUploaded }: UploadProofDialogProps) {
  const [open, setOpen] = useState(false);
  const { mutate: upload, isPending } = useUploadServiceProof();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UploadProofFormValues>({ resolver: zodResolver(uploadProofSchema) });

  const onSubmit = (values: UploadProofFormValues) =>
    upload(
      { id: invoice.id, proof: values.proof },
      {
        onSuccess: () => {
          reset();
          setOpen(false);
          onUploaded?.();
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
        <Button size="sm">{invoice.status === "REJECTED" ? "Unggah Ulang" : "Unggah Bukti"}</Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>Unggah Bukti Transfer</DialogTitle>
          <DialogDescription>
            {invoice.invoice_number} — {invoice.service_name} sebesar {money(invoice.amount)} untuk{" "}
            {invoice.duration_days} hari. Langganan aktif setelah pembayaran dikonfirmasi.
          </DialogDescription>
        </DialogHeader>

        {invoice.status === "REJECTED" && invoice.notes && (
          <Text
            variant="small"
            className="text-destructive"
          >
            Ditolak: {invoice.notes}
          </Text>
        )}

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
                id={`service-proof-${invoice.id}`}
                label="Bukti Transfer"
                caption="Lampirkan struk atau tangkapan layar transfer."
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
              {isPending ? "Mengunggah…" : "Kirim Bukti"}
            </Button>
          </DialogFooter>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
