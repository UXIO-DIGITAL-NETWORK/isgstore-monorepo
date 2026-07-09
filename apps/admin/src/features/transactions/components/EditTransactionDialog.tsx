import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UploadCloud } from "lucide-react";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { INVOICE_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from "../data/select-options.data";
import { editTransactionSchema, type EditTransactionFormValues } from "../schemas/editTransaction.schema";
import { useEditTransaction } from "../hooks/useTransactions";
import type { Transaction } from "../types/transaction.type";

interface EditTransactionDialogProps {
  transaction: Transaction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Manual status-override modal (product_requirements.md §4.3). The reference's
 * modal subcopy and "Serial Number as a select showing 'Text'" were both
 * unedited shadcn template artifacts — real copy + a plain text input here.
 */
export function EditTransactionDialog({ transaction, open, onOpenChange }: EditTransactionDialogProps) {
  const editTransaction = useEditTransaction();
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<EditTransactionFormValues>({
    resolver: zodResolver(editTransactionSchema),
    defaultValues: {
      paymentStatus: transaction.payment_status,
      invoiceStatus: transaction.invoice_status,
      serialNumber: transaction.serial_number ?? "",
    },
  });

  // Reset to this row's current values every time the dialog re-opens (rows
  // share no state, but the dialog instance is mounted once per row).
  useEffect(() => {
    if (open) {
      reset({
        paymentStatus: transaction.payment_status,
        invoiceStatus: transaction.invoice_status,
        serialNumber: transaction.serial_number ?? "",
      });
    }
  }, [open, transaction, reset]);

  const proofFile = watch("proofFile");

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) setValue("proofFile", file, { shouldValidate: true });
  };

  const onSubmit = (values: EditTransactionFormValues) => {
    const formData = new FormData();
    formData.append("paymentStatus", values.paymentStatus);
    formData.append("invoiceStatus", values.invoiceStatus);
    if (values.serialNumber) formData.append("serialNumber", values.serialNumber);
    if (values.proofFile) formData.append("proofFile", values.proofFile);

    editTransaction.mutate({ id: transaction.id, formData }, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
          <DialogDescription>
            Update the payment and invoice status for this transaction, or attach proof of settlement.
          </DialogDescription>
        </DialogHeader>

        <Box
          as="form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="edit-payment-status">Status Payment</Label>
            <Controller
              control={control}
              name="paymentStatus"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id="edit-payment-status"
                    className="w-full"
                  >
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_STATUS_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.paymentStatus && (
              <Text
                variant="small"
                className="text-destructive"
              >
                {errors.paymentStatus.message}
              </Text>
            )}
          </Box>

          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="edit-invoice-status">Invoice Status</Label>
            <Controller
              control={control}
              name="invoiceStatus"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id="edit-invoice-status"
                    className="w-full"
                  >
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {INVOICE_STATUS_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.invoiceStatus && (
              <Text
                variant="small"
                className="text-destructive"
              >
                {errors.invoiceStatus.message}
              </Text>
            )}
          </Box>

          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="edit-serial-number">Serial Number</Label>
            <Input
              id="edit-serial-number"
              placeholder="e.g. SN-00123"
              {...register("serialNumber")}
            />
          </Box>

          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="edit-proof-file">Invoice Proof</Label>
            <Box
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragActive(false);
                handleFiles(event.dataTransfer.files);
              }}
              className={cn(
                "flex flex-col items-center gap-2 rounded-lg border border-dashed border-border p-6 text-center",
                dragActive && "border-foreground bg-accent",
              )}
            >
              <UploadCloud className="size-6 text-muted-foreground" />
              <Text variant="small">Drag & drop files here</Text>
              <Text variant="small">JPG, JPEG, PNG up to 10mb</Text>
              <input
                ref={fileInputRef}
                id="edit-proof-file"
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                className="hidden"
                onChange={(event) => handleFiles(event.target.files)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Browse files
              </Button>
              {proofFile && <Text variant="small">{proofFile.name}</Text>}
            </Box>
            {errors.proofFile && (
              <Text
                variant="small"
                className="text-destructive"
              >
                {errors.proofFile.message}
              </Text>
            )}
          </Box>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={editTransaction.isPending}
            >
              {editTransaction.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
