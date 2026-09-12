import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
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
  { value: "payment-gateway", labelKey: "serviceForm.categoryPaymentGateway" },
  { value: "supplier", labelKey: "serviceForm.categorySupplier" },
  { value: "communication", labelKey: "serviceForm.categoryCommunication" },
  { value: "infrastructure", labelKey: "serviceForm.categoryInfrastructure" },
  { value: "other", labelKey: "serviceForm.categoryOther" },
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
  cost_price: service?.cost_price ?? 0,
  selling_price: service?.selling_price ?? 0,
  duration_days: service?.duration_days ?? 30,
  is_active: service?.is_active ?? true,
});

/**
 * Create or edit a catalogue entry. One dialog for both, because the fields
 * are identical and a separate edit form would drift from the create one.
 */

/**
 * Options carry a key, not a label, so they move with the panel's language —
 * a module constant would freeze whichever language was loaded at import.
 */
const translated = (
  options: ReadonlyArray<{ value: string; labelKey: string }>,
  t: TFunction<"finance">,
) => options.map((option) => ({ value: option.value, label: t(option.labelKey) }));

export function ServiceFormDialog({ service }: ServiceFormDialogProps) {
  const { t } = useTranslation("finance");
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
          {isEdit ? t("serviceForm.triggerEdit") : t("serviceForm.triggerCreate")}
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("serviceForm.titleEdit") : t("serviceForm.titleCreate")}</DialogTitle>
          <DialogDescription>
            {t("serviceForm.description")}
          </DialogDescription>
        </DialogHeader>

        <Box
          as="form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <Box className="grid gap-4 sm:grid-cols-2">
            <Box className="flex flex-col gap-1.5">
              <Label htmlFor="service-code">{t("serviceForm.code")}</Label>
              <Input
                id="service-code"
                placeholder={t("serviceForm.codePlaceholder")}
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
              <Label htmlFor="service-name">{t("serviceForm.name")}</Label>
              <Input
                id="service-name"
                placeholder={t("serviceForm.namePlaceholder")}
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
                  label={t("serviceForm.category")}
                  options={translated(CATEGORY_OPTIONS, t)}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.category?.message}
                  placeholder={t("serviceForm.categoryPlaceholder")}
                />
              )}
            />

            <Box className="flex flex-col gap-1.5">
              <Label htmlFor="service-duration">{t("serviceForm.duration")}</Label>
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
              <Label htmlFor="service-cost-price">{t("serviceForm.costPrice")}</Label>
              <Input
                id="service-cost-price"
                type="number"
                min={0}
                {...register("cost_price", { valueAsNumber: true })}
              />
              {errors.cost_price && (
                <Text
                  variant="small"
                  className="text-destructive"
                >
                  {errors.cost_price.message}
                </Text>
              )}
            </Box>

            <Box className="flex flex-col gap-1.5">
              <Label htmlFor="service-selling-price">{t("serviceForm.sellingPrice")}</Label>
              <Input
                id="service-selling-price"
                type="number"
                min={0}
                {...register("selling_price", { valueAsNumber: true })}
              />
              {errors.selling_price && (
                <Text
                  variant="small"
                  className="text-destructive"
                >
                  {errors.selling_price.message}
                </Text>
              )}
            </Box>

            <Controller
              control={control}
              name="is_active"
              render={({ field }) => (
                <SelectField
                  id="service-status"
                  label={t("serviceForm.status")}
                  options={[
                    { value: "true", label: t("serviceForm.statusActive") },
                    { value: "false", label: t("serviceForm.statusInactive") },
                  ]}
                  value={String(field.value)}
                  onChange={(value) => field.onChange(value === "true")}
                />
              )}
            />
          </Box>

          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="service-description">{t("serviceForm.descriptionField")}</Label>
            <Textarea
              id="service-description"
              rows={2}
              {...register("description")}
            />
          </Box>

          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="service-features">{t("serviceForm.features")}</Label>
            <Textarea
              id="service-features"
              rows={3}
              placeholder={t("serviceForm.featuresPlaceholder")}
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
              {t("serviceForm.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isPending}
            >
              {isPending ? t("serviceForm.saving") : t("serviceForm.save")}
            </Button>
          </DialogFooter>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
