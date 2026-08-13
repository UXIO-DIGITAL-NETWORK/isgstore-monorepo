import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Box } from "@/components/common/Box";
import { SelectField } from "@/components/common/SelectField";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Service } from "@/types/service.type";

import { useCreateService, useUpdateService } from "../hooks/useFinance";
import { serviceSchema, toFeatureList, type ServiceFormValues } from "../schemas/service.schema";

const CATEGORY_OPTIONS = [
  { value: "payment-gateway", label: "Payment Gateway" },
  { value: "supplier", label: "Supplier" },
  { value: "communication", label: "Komunikasi" },
  { value: "infrastructure", label: "Infrastruktur" },
  { value: "other", label: "Lainnya" },
];

interface ServiceFormDialogProps {
  /** Absent = create. Present = edit that row. */
  service?: Service;
}

const defaults = (service?: Service): ServiceFormValues => ({
  code: service?.code ?? "",
  name: service?.name ?? "",
  category: service?.category ?? "other",
  description: service?.description ?? "",
  features: (service?.features ?? []).join("\n"),
  price: service?.price ?? 0,
  duration_days: service?.duration_days ?? 30,
  is_active: service?.is_active ?? true,
});

/**
 * Create or edit a catalogue entry. One dialog for both, because the fields
 * are identical and a separate edit form would drift from the create one.
 */
export function ServiceFormDialog({ service }: ServiceFormDialogProps) {
  const [open, setOpen] = useState(false);
  const { mutate: create, isPending: creating } = useCreateService();
  const { mutate: update, isPending: updating } = useUpdateService();

  const isEdit = Boolean(service);
  const isPending = creating || updating;

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: defaults(service),
  });

  const onSubmit = (values: ServiceFormValues) => {
    const payload = {
      ...values,
      description: values.description || null,
      features: toFeatureList(values.features),
    };

    const done = {
      onSuccess: () => {
        reset(defaults(service));
        setOpen(false);
      },
    };

    if (service) {
      update({ id: service.id, payload }, done);
    } else {
      create(payload, done);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        // Reset to the row's own values, so reopening an edit does not show
        // whatever was half-typed the previous time.
        if (!next) reset(defaults(service));
      }}
    >
      <DialogTrigger asChild>
        <Button
          size={isEdit ? "sm" : "default"}
          variant={isEdit ? "outline" : "default"}
        >
          {isEdit ? "Edit" : "Tambah Service"}
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Service" : "Tambah Service"}</DialogTitle>
          <DialogDescription>
            Atur harga dan masa aktif satu periode langganan untuk service ini.
          </DialogDescription>
        </DialogHeader>

        <Box
          as="form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <Box className="grid gap-4 sm:grid-cols-2">
            <Box className="flex flex-col gap-1.5">
              <Label htmlFor="service-code">Kode</Label>
              <Input
                id="service-code"
                placeholder="whatsapp-api"
                {...register("code")}
              />
              {errors.code && (
                <Text
                  variant="small"
                  className="text-destructive"
                >
                  {errors.code.message}
                </Text>
              )}
            </Box>

            <Box className="flex flex-col gap-1.5">
              <Label htmlFor="service-name">Nama</Label>
              <Input
                id="service-name"
                placeholder="WhatsApp API"
                {...register("name")}
              />
              {errors.name && (
                <Text
                  variant="small"
                  className="text-destructive"
                >
                  {errors.name.message}
                </Text>
              )}
            </Box>

            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <SelectField
                  id="service-category"
                  label="Kategori"
                  options={CATEGORY_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.category?.message}
                  placeholder="Pilih kategori"
                />
              )}
            />

            <Box className="flex flex-col gap-1.5">
              <Label htmlFor="service-duration">Masa Aktif (hari)</Label>
              <Input
                id="service-duration"
                type="number"
                min={1}
                {...register("duration_days", { valueAsNumber: true })}
              />
              {errors.duration_days && (
                <Text
                  variant="small"
                  className="text-destructive"
                >
                  {errors.duration_days.message}
                </Text>
              )}
            </Box>

            <Box className="flex flex-col gap-1.5">
              <Label htmlFor="service-price">Harga (Rp)</Label>
              <Input
                id="service-price"
                type="number"
                min={0}
                {...register("price", { valueAsNumber: true })}
              />
              {errors.price && (
                <Text
                  variant="small"
                  className="text-destructive"
                >
                  {errors.price.message}
                </Text>
              )}
            </Box>

            <Controller
              control={control}
              name="is_active"
              render={({ field }) => (
                <SelectField
                  id="service-status"
                  label="Status"
                  options={[
                    { value: "true", label: "Aktif" },
                    { value: "false", label: "Nonaktif" },
                  ]}
                  value={String(field.value)}
                  onChange={(value) => field.onChange(value === "true")}
                />
              )}
            />
          </Box>

          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="service-description">Deskripsi</Label>
            <Textarea
              id="service-description"
              rows={2}
              {...register("description")}
            />
          </Box>

          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="service-features">Fitur</Label>
            <Textarea
              id="service-features"
              rows={3}
              placeholder={"Satu fitur per baris"}
              {...register("features")}
            />
            <Text
              variant="small"
              className="text-muted-foreground"
            >
              Satu fitur per baris. Ditampilkan sebagai poin di katalog client.
            </Text>
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
              type="submit"
              disabled={isPending}
            >
              {isPending ? "Menyimpan…" : "Simpan"}
            </Button>
          </DialogFooter>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
