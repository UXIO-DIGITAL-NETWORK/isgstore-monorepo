import { useLocation, useNavigate, useParams } from "@tanstack/react-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Link } from "@/components/common/Link";
import { SelectField } from "@/components/common/SelectField";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCreatePromo, usePromo, useUpdatePromo } from "../hooks/usePromos";
import { promoFormSchema, type PromoFormValues } from "../schemas/promoForm.schema";

const TYPE_OPTIONS = [
  { value: "percentage", label: "Percentage (%)" },
  { value: "fixed", label: "Fixed amount (Rp)" },
];

/** `2026-08-30T09:00:00.000000Z` → `2026-08-30`, which is what a date input takes. */
const toDateInput = (value?: string) => (value ? value.slice(0, 10) : "");

export function PromoFormPage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { promoId } = useParams({ strict: false }) as { promoId?: string };
  const isEdit = Boolean(promoId);

  const listHref = isEdit ? pathname.replace(/\/[^/]+\/edit\/?$/, "") : pathname.replace(/\/add\/?$/, "");

  const { data: existing } = usePromo(promoId);
  const createPromo = useCreatePromo();
  const updatePromo = useUpdatePromo();
  const isPending = createPromo.isPending || updatePromo.isPending;

  const {
    control,
    register,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<PromoFormValues>({
    resolver: zodResolver(promoFormSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      type: "percentage",
      value: 10,
      minPurchase: 0,
      isPublic: false,
      isActive: true,
    },
    values: existing
      ? {
          code: existing.code,
          name: existing.name,
          description: existing.description ?? "",
          type: existing.type,
          value: existing.value,
          maxDiscount: existing.max_discount,
          minPurchase: existing.min_purchase,
          quotaTotal: existing.quota_total,
          quotaPerUser: existing.quota_per_user,
          startsAt: toDateInput(existing.starts_at),
          endsAt: toDateInput(existing.ends_at),
          isPublic: existing.is_public,
          isActive: existing.is_active,
        }
      : undefined,
  });

  const type = watch("type");

  const onSubmit = (values: PromoFormValues) => {
    const payload = {
      code: values.code,
      name: values.name,
      description: values.description || undefined,
      type: values.type,
      value: values.value,
      // Only meaningful for a percentage — a fixed discount is already a cap.
      max_discount: values.type === "percentage" ? values.maxDiscount : undefined,
      min_purchase: values.minPurchase,
      scope: "global" as const,
      quota_total: values.quotaTotal,
      quota_per_user: values.quotaPerUser,
      starts_at: values.startsAt || undefined,
      ends_at: values.endsAt || undefined,
      is_public: values.isPublic,
      is_active: values.isActive,
    };
    const onSuccess = () => navigate({ to: listHref as unknown as string });

    if (promoId) {
      updatePromo.mutate({ id: promoId, input: payload }, { onSuccess });
      return;
    }
    createPromo.mutate(payload as never, { onSuccess });
  };

  return (
    <Box
      as="form"
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-6"
    >
      <Box className="rounded-2xl border border-border bg-card p-6">
        <Heading
          level={1}
          variant="section"
        >
          {isEdit ? "Edit Promo" : "Add Promo"}
        </Heading>
        <Text variant="muted">
          Discount codes applied at checkout. A public code is advertised on the storefront; a private one still works
          when a customer types it.
        </Text>
      </Box>

      <Box className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
        <Box className="grid gap-4 sm:grid-cols-2">
          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="promo-code">Code</Label>
            <Input
              id="promo-code"
              className="rounded-xl uppercase tracking-wider"
              placeholder="HEMAT10"
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
            <Label htmlFor="promo-name">Name</Label>
            <Input
              id="promo-name"
              className="rounded-xl"
              placeholder="Diskon 10% Semua Game"
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
        </Box>

        <Box className="flex flex-col gap-1.5">
          <Label htmlFor="promo-description">Description</Label>
          <Textarea
            id="promo-description"
            rows={2}
            className="rounded-xl"
            {...register("description")}
          />
        </Box>

        <Box className="grid gap-4 sm:grid-cols-3">
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <SelectField
                id="promo-type"
                label="Type"
                options={TYPE_OPTIONS}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="promo-value">{type === "percentage" ? "Percentage" : "Amount"}</Label>
            <Input
              id="promo-value"
              type="number"
              min={1}
              className="rounded-xl tabular-nums"
              {...register("value", { valueAsNumber: true })}
            />
            {errors.value && (
              <Text
                variant="small"
                className="text-destructive"
              >
                {errors.value.message}
              </Text>
            )}
          </Box>
          {type === "percentage" && (
            <Box className="flex flex-col gap-1.5">
              <Label htmlFor="promo-max">Max Discount</Label>
              <Input
                id="promo-max"
                type="number"
                min={0}
                className="rounded-xl tabular-nums"
                {...register("maxDiscount", { valueAsNumber: true })}
              />
            </Box>
          )}
        </Box>

        <Box className="grid gap-4 sm:grid-cols-3">
          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="promo-min">Min. Purchase</Label>
            <Input
              id="promo-min"
              type="number"
              min={0}
              className="rounded-xl tabular-nums"
              {...register("minPurchase", { valueAsNumber: true })}
            />
          </Box>
          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="promo-quota">Total Quota</Label>
            <Input
              id="promo-quota"
              type="number"
              min={0}
              placeholder="Unlimited"
              className="rounded-xl tabular-nums"
              {...register("quotaTotal", { valueAsNumber: true })}
            />
          </Box>
          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="promo-quota-user">Quota Per User</Label>
            <Input
              id="promo-quota-user"
              type="number"
              min={0}
              placeholder="Unlimited"
              className="rounded-xl tabular-nums"
              {...register("quotaPerUser", { valueAsNumber: true })}
            />
          </Box>
        </Box>

        <Box className="grid gap-4 sm:grid-cols-2">
          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="promo-starts">Starts</Label>
            <Input
              id="promo-starts"
              type="date"
              className="rounded-xl"
              {...register("startsAt")}
            />
          </Box>
          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="promo-ends">Ends</Label>
            <Input
              id="promo-ends"
              type="date"
              className="rounded-xl"
              {...register("endsAt")}
            />
            {errors.endsAt && (
              <Text
                variant="small"
                className="text-destructive"
              >
                {errors.endsAt.message}
              </Text>
            )}
          </Box>
        </Box>

        <Box className="flex flex-col gap-3 sm:flex-row sm:gap-8">
          <Controller
            control={control}
            name="isPublic"
            render={({ field }) => (
              <Box className="flex items-center gap-3">
                <Switch
                  id="promo-public"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <Label htmlFor="promo-public">Advertise on storefront</Label>
              </Box>
            )}
          />
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <Box className="flex items-center gap-3">
                <Switch
                  id="promo-active"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <Label htmlFor="promo-active">Active</Label>
              </Box>
            )}
          />
        </Box>

        <Box className="flex justify-end gap-3">
          <Button
            asChild
            variant="outline"
            className="rounded-xl"
          >
            <Link href={listHref}>Cancel</Link>
          </Button>
          <Button
            type="submit"
            className="rounded-xl"
            disabled={isPending}
          >
            {isPending ? "Saving..." : "Save"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default PromoFormPage;
