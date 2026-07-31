import { useLocation, useNavigate, useParams } from "@tanstack/react-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { ImageDropzone } from "@/components/common/ImageDropzone";
import { Link } from "@/components/common/Link";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCategoryList } from "../hooks/useCategories";
import { useCreateSubCategory, useSubCategory, useUpdateSubCategory } from "../hooks/useSubCategories";
import { DESCRIPTION_MAX, subCategoryFormSchema, type SubCategoryFormValues } from "../schemas/subCategoryForm.schema";

const CATEGORY_OPTIONS_PAGE_SIZE = 100;
const EMPTY_VALUES: SubCategoryFormValues = { categoryId: "", name: "", currencyName: "", description: "" };

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <Text
      variant="small"
      className="text-destructive"
    >
      {message}
    </Text>
  );
}

/**
 * Add / Edit Sub Category (product_requirements.md §4.5, line 210) — one form
 * for both, as a page rather than a modal, consistent with how Transaction's
 * edit flow was converted. Every placeholder in the reference is generic lorem
 * ipsum; real hints are written here instead, and the description counter's
 * percentage is derived from the actual length rather than the reference's
 * mismatched "0/280 characters" / "52% used".
 */
export default function SubCategoryFormPage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  // `strict: false` so one component serves both the add route (no params)
  // and the edit route (`$subCategoryId`).
  const { subCategoryId } = useParams({ strict: false }) as { subCategoryId?: string };
  const isEdit = Boolean(subCategoryId);

  const listHref = isEdit ? pathname.replace(/\/[^/]+\/edit\/?$/, "") : pathname.replace(/\/add\/?$/, "");

  const { data: categories } = useCategoryList({ per_page: CATEGORY_OPTIONS_PAGE_SIZE });
  const { data: existing } = useSubCategory(subCategoryId);

  const createSubCategory = useCreateSubCategory();
  const updateSubCategory = useUpdateSubCategory();
  const isPending = createSubCategory.isPending || updateSubCategory.isPending;

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SubCategoryFormValues>({
    resolver: zodResolver(subCategoryFormSchema),
    defaultValues: EMPTY_VALUES,
    // `values` (not `defaultValues`) so the form re-syncs once the record
    // resolves — on edit it is undefined for the first render.
    values: existing
      ? {
          categoryId: existing.category_id,
          name: existing.name,
          currencyName: existing.currency_name,
          description: existing.description ?? "",
        }
      : undefined,
  });

  const descriptionLength = (watch("description") ?? "").length;
  const descriptionPercent = Math.round((descriptionLength / DESCRIPTION_MAX) * 100);

  const onSubmit = (values: SubCategoryFormValues) => {
    const payload = {
      category_id: values.categoryId,
      name: values.name,
      currency_name: values.currencyName,
      // ponytail: file name stands in for the uploaded URL (UI-first, no
      // backend); swap to the URL returned by the §4.9 upload helper.
      logo_url: values.logo?.name,
      description: values.description || undefined,
      status: "active" as const,
    };
    const onSuccess = () => navigate({ to: listHref as unknown as string });

    if (subCategoryId) {
      updateSubCategory.mutate({ id: subCategoryId, input: payload }, { onSuccess });
      return;
    }
    createSubCategory.mutate(payload, { onSuccess });
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
          {isEdit ? "Edit Sub Category" : "Add Sub Category"}
        </Heading>
        <Text variant="muted">
          {isEdit
            ? "Update this sub category's parent, currency, and storefront details."
            : "Group a category's currencies or item types into a sub category buyers can pick from."}
        </Text>
      </Box>

      <Box className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
        <Controller
          control={control}
          name="categoryId"
          render={({ field }) => (
            <Box className="flex flex-col gap-1.5">
              <Label htmlFor="sub-category-parent">Category</Label>
              <Select
                value={field.value}
                onValueChange={field.onChange}
              >
                <SelectTrigger
                  id="sub-category-parent"
                  className="w-full rounded-xl"
                >
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {(categories?.data ?? []).map((category) => (
                    <SelectItem
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={errors.categoryId?.message} />
            </Box>
          )}
        />

        <Box className="flex flex-col gap-1.5">
          <Label htmlFor="sub-category-name">Sub Category Name</Label>
          <Input
            id="sub-category-name"
            className="rounded-xl"
            placeholder="e.g. Mobile Legends: Global"
            {...register("name")}
          />
          <FieldError message={errors.name?.message} />
        </Box>

        <Box className="flex flex-col gap-1.5">
          <Label htmlFor="sub-category-currency-name">Currency Name</Label>
          <Input
            id="sub-category-currency-name"
            className="rounded-xl"
            placeholder="e.g. Diamonds"
            {...register("currencyName")}
          />
          <FieldError message={errors.currencyName?.message} />
        </Box>

        <Controller
          control={control}
          name="logo"
          render={({ field }) => (
            <ImageDropzone
              id="sub-category-logo"
              label="Logo"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              formatsLabel="JPG, JPEG, PNG, WEBP up to 10mb"
              caption="3:4 ratio recommended · max display 800×600 px"
              value={field.value}
              onChange={field.onChange}
              error={errors.logo?.message}
            />
          )}
        />

        <Box className="flex flex-col gap-1.5">
          <Label htmlFor="sub-category-description">Description</Label>
          <Textarea
            id="sub-category-description"
            className="rounded-xl"
            placeholder="Short summary shown with this sub category on the storefront"
            maxLength={DESCRIPTION_MAX}
            {...register("description")}
          />
          <Box className="flex justify-between">
            <Text variant="small">
              {descriptionLength}/{DESCRIPTION_MAX} characters
            </Text>
            <Text variant="small">{descriptionPercent}% used</Text>
          </Box>
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
