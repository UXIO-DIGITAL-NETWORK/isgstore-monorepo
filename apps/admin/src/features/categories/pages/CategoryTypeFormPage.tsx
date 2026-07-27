import { useLocation, useNavigate, useParams } from "@tanstack/react-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Link } from "@/components/common/Link";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCategoryType, useCreateCategoryType, useUpdateCategoryType } from "../hooks/useCategoryTypes";
import { categoryTypeFormSchema, type CategoryTypeFormValues } from "../schemas/categoryTypeForm.schema";

const EMPTY_VALUES: CategoryTypeFormValues = { name: "", isVoucher: false };

/**
 * Add / Edit Category Type (product_requirements.md §4.5) — one form for
 * both, as a page rather than a modal, consistent with every other edit flow
 * in this feature.
 *
 * The reference's field placeholder and header subcopy are generic lorem
 * ipsum and are replaced. The checkbox label and its helper text are the one
 * part of this reference that reads as deliberately written, so both are used
 * verbatim.
 */
export default function CategoryTypeFormPage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  // `strict: false` so one component serves both the add route (no params)
  // and the edit route (`$categoryTypeId`).
  const { categoryTypeId } = useParams({ strict: false }) as { categoryTypeId?: string };
  const isEdit = Boolean(categoryTypeId);

  const listHref = isEdit ? pathname.replace(/\/[^/]+\/edit\/?$/, "") : pathname.replace(/\/add\/?$/, "");

  const { data: existing } = useCategoryType(categoryTypeId);
  const createCategoryType = useCreateCategoryType();
  const updateCategoryType = useUpdateCategoryType();
  const isPending = createCategoryType.isPending || updateCategoryType.isPending;

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryTypeFormValues>({
    resolver: zodResolver(categoryTypeFormSchema),
    defaultValues: EMPTY_VALUES,
    // `values` (not `defaultValues`) so the form re-syncs once the record
    // resolves — on edit it is undefined for the first render.
    values: existing ? { name: existing.name, isVoucher: existing.is_voucher } : undefined,
  });

  const onSubmit = (values: CategoryTypeFormValues) => {
    const payload = { name: values.name, is_voucher: values.isVoucher, status: "active" as const };
    const onSuccess = () => navigate({ to: listHref as unknown as string });

    if (categoryTypeId) {
      // Status is owned by the row menu's Deactive/Activate action, so an
      // edit must not reset it.
      updateCategoryType.mutate(
        { id: categoryTypeId, input: { name: values.name, is_voucher: values.isVoucher } },
        { onSuccess },
      );
      return;
    }
    createCategoryType.mutate(payload, { onSuccess });
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
          {isEdit ? "Edit Category Type" : "Add Category Type"}
        </Heading>
        <Text variant="muted">
          {isEdit
            ? "Rename this category type or change whether it sells vouchers."
            : "Define how a group of categories is classified, and whether it sells vouchers or digital codes."}
        </Text>
      </Box>

      <Box className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
        <Box className="flex flex-col gap-1.5">
          <Label htmlFor="category-type-name">Category Type Name</Label>
          <Input
            id="category-type-name"
            className="rounded-xl"
            placeholder="e.g. Voucher, Direct Top Up"
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
          name="isVoucher"
          render={({ field }) => (
            <Box className="flex flex-col gap-1.5">
              <Box className="flex items-center gap-2">
                <Checkbox
                  id="category-type-is-voucher"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                />
                <Label htmlFor="category-type-is-voucher">This category type is for vouchers</Label>
              </Box>
              <Text
                variant="small"
                className="text-muted-foreground"
              >
                Enable if this category type is used for selling vouchers or digital codes.
              </Text>
            </Box>
          )}
        />

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
