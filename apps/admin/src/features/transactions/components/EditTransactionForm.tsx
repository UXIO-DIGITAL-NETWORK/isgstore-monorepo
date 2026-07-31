import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UploadCloud } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Link } from "@/components/common/Link";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { INVOICE_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from "../data/select-options.data";
import { editTransactionSchema, type EditTransactionFormValues } from "../schemas/editTransaction.schema";
import { useEditTransaction } from "../hooks/useTransactions";
import type { Transaction } from "../types/transaction.type";

interface EditTransactionFormProps {
  transaction: Transaction;
  /** Where Cancel goes — derived from the URL by the page, so the same form serves the preview route. */
  cancelHref: string;
  onSaved: () => void;
}

/**
 * The four manual-status-override fields (product_requirements.md §4.3),
 * single column, with Cancel/Save at the bottom-right of the card. The card
 * IS the form element, matching the reference where the actions sit inside
 * it rather than trailing below (unlike Add Category).
 *
 * The reference's "Serial Number" renders as a select showing the literal
 * word "Text" — a template artifact now seen on two independent references
 * (the earlier modal and this page), so it stays a plain text input.
 */
export function EditTransactionForm({ transaction, cancelHref, onSaved }: EditTransactionFormProps) {
  const editTransaction = useEditTransaction();
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // No reset-on-open effect (the modal needed one because it was mounted once
  // per table row and outlived its open state) — a route mounts fresh, and the
  // page keys this component by transaction id.
  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EditTransactionFormValues>({
    resolver: zodResolver(editTransactionSchema),
    defaultValues: {
      paymentStatus: transaction.payment_status,
      invoiceStatus: transaction.invoice_status,
      serialNumber: transaction.serial_number ?? "",
    },
  });

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

    // Success toast + cache invalidation live in the hook; failure toasts
    // there too and leaves the operator on this page with their input intact.
    editTransaction.mutate({ id: transaction.id, formData }, { onSuccess: onSaved });
  };

  return (
    <Box
      as="form"
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6"
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
                className="w-full rounded-xl"
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
                className="w-full rounded-xl"
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
          type="text"
          className="rounded-xl"
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
            "flex flex-col items-center gap-2 rounded-xl border border-dashed border-input p-6 text-center",
            dragActive ? "border-foreground bg-accent" : "bg-transparent dark:bg-input/30",
          )}
        >
          <UploadCloud className="size-6 text-muted-foreground" />
          <Text variant="small">Drag &amp; drop files here</Text>
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
            className="rounded-xl"
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

      <Box className="flex justify-end gap-3">
        <Button
          asChild
          variant="outline"
          className="rounded-xl"
        >
          <Link href={cancelHref}>Cancel</Link>
        </Button>
        <Button
          type="submit"
          className="rounded-xl"
          disabled={editTransaction.isPending}
        >
          {editTransaction.isPending ? "Saving..." : "Save"}
        </Button>
      </Box>
    </Box>
  );
}
