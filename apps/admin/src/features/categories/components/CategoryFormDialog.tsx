import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { ImageDropzone } from "@/components/common/ImageDropzone";
import { SelectField } from "@/components/common/SelectField";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CategoryFormFieldsBuilder } from "./CategoryFormFieldsBuilder";
import {
  CATEGORY_UID_PARSER_OPTIONS,
  META_ROBOTS_OPTIONS,
  REGION_OPTIONS,
} from "../data/select-options.data";
import { useCategory, useCreateCategory, useUpdateCategory } from "../hooks/useCategories";
import { useCategoryTypeOptions } from "../hooks/useCategoryTypeOptions";
import { categoryFormSchema, META_DESCRIPTION_MAX, type CategoryFormValues } from "../schemas/categoryForm.schema";

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode; absent = add mode. */
  categoryId?: string;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Add / Edit Category (product_requirements.md §4.5), as a modal — the
 * create/update flow no longer navigates to its own page.
 */
export function CategoryFormDialog({ open, onOpenChange, categoryId }: CategoryFormDialogProps) {
  const isEdit = Boolean(categoryId);
  const { data: existing } = useCategory(open ? categoryId : undefined);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      categoryType: "",
      uidParser: "",
      name: "",
      subName: "",
      accountNicknameValidation: "",
      region: "",
      code: "",
      slug: "",
      orderFormFields: [],
      description: "",
      metaTitle: "",
      metaDescription: "",
      metaKeywords: "",
      metaRobots: "",
    },
    // `values` rather than `defaultValues` so the form re-syncs once the record
    // resolves — on edit it is undefined for the first render.
    values: existing
      ? {
          categoryType: existing.type,
          uidParser: existing.uid_parser,
          name: existing.name,
          subName: existing.sub_name ?? "",
          accountNicknameValidation: existing.account_nickname_validation ?? "",
          region: existing.region ?? "",
          code: existing.code,
          slug: existing.slug,
          orderFormFields: existing.order_form_fields.map((field) => ({
            ...field,
            required: field.required ?? false,
          })),
          description: existing.description ?? "",
          metaTitle: existing.meta_title ?? "",
          metaDescription: existing.meta_description ?? "",
          metaKeywords: (existing.meta_keywords ?? []).join(", "),
          metaRobots: existing.meta_robots ?? "",
        }
      : undefined,
  });

  const metaDescriptionLength = (watch("metaDescription") ?? "").length;
  const metaDescriptionPercent = Math.round((metaDescriptionLength / META_DESCRIPTION_MAX) * 100);

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const isPending = createCategory.isPending || updateCategory.isPending;
  const { options: categoryTypeOptions, isLoading: typesLoading } = useCategoryTypeOptions();

  const handleNameBlur = () => {
    const { name, slug } = getValues();
    if (name && !slug) setValue("slug", slugify(name));
  };

  const onSubmit = (values: CategoryFormValues) => {
    const metaKeywords = (values.metaKeywords ?? "")
      .split(",")
      .map((keyword) => keyword.trim())
      .filter(Boolean);

    const payload = {
        // The select carries a real category-type id; `type` remains the
        // display name the list column reads.
        type_id: values.categoryType,
        type: values.categoryType,
        uid_parser: values.uidParser,
        name: values.name,
        sub_name: values.subName || undefined,
        account_nickname_validation: values.accountNicknameValidation || undefined,
        region: values.region || undefined,
        code: values.code,
        slug: values.slug,
        status: "active" as const,
        order_form_fields: values.orderFormFields,
        description: values.description || undefined,
        meta_title: values.metaTitle || undefined,
        meta_description: values.metaDescription || undefined,
        logo: values.logo,
        og_image: values.ogImage,
        meta_keywords: metaKeywords.length ? metaKeywords : undefined,
        meta_robots: values.metaRobots || undefined,
    };

    const onSuccess = () => onOpenChange(false);

    if (categoryId) {
      // The service reads the row first to carry `customer_no_template`
      // across — losing it would break supplier fulfilment after payment.
      updateCategory.mutate({ id: categoryId, input: payload }, { onSuccess });
      return;
    }

    createCategory.mutate(payload as never, { onSuccess });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Category" : "Add Category"}</DialogTitle>
          <DialogDescription>
            Define a new taxonomy entry games and products can be grouped under.
          </DialogDescription>
        </DialogHeader>

        <Box
          as="form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-6"
        >
          <Box className="flex flex-col gap-4">
            <Box>
              <Heading
                as="h2"
                level={5}
              >
                Basic information
              </Heading>
              <Text variant="muted">Type, validation, and category identity on the storefront.</Text>
            </Box>

            <Box className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Controller
                control={control}
                name="categoryType"
                render={({ field }) => (
                  <SelectField
                    id="category-type"
                    label="Category Type"
                    options={categoryTypeOptions}
                    disabled={typesLoading}
                    emptyLabel={typesLoading ? "Loading types..." : "No category types available"}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.categoryType?.message}
                  />
                )}
              />
              <Box className="flex flex-col gap-1.5">
                <Label htmlFor="account-nickname-validation">Account Nickname Validation</Label>
                <Input
                  id="account-nickname-validation"
                  className="rounded-xl"
                  placeholder="digiflazz:ffusername"
                  {...register("accountNicknameValidation")}
                />
                <Text
                  variant="muted"
                  className="text-xs"
                >
                  Enables the “Cek Username” button for this game. Leave blank for none. Enter
                  digiflazz:SKU for a paid Digiflazz check (e.g. digiflazz:ffusername), or a full
                  lookup URL for a free third-party API.
                </Text>
              </Box>

              <Controller
                control={control}
                name="uidParser"
                render={({ field }) => (
                  <SelectField
                    id="category-uid-parser"
                    label="Category UID Parser"
                    options={CATEGORY_UID_PARSER_OPTIONS}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.uidParser?.message}
                  />
                )}
              />
              <Controller
                control={control}
                name="region"
                render={({ field }) => (
                  <SelectField
                    id="category-region"
                    label="Region"
                    options={REGION_OPTIONS}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                )}
              />

              <Box className="flex flex-col gap-1.5">
                <Label htmlFor="category-name">Category Name</Label>
                <Input
                  id="category-name"
                  className="rounded-xl"
                  {...register("name", { onBlur: handleNameBlur })}
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
              <Box className="flex flex-col gap-1.5">
                <Label htmlFor="category-code">Category Code</Label>
                <Input
                  id="category-code"
                  className="rounded-xl"
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
                <Label htmlFor="category-sub-name">Category Sub Name</Label>
                <Input
                  id="category-sub-name"
                  className="rounded-xl"
                  {...register("subName")}
                />
              </Box>
              <Box className="flex flex-col gap-1.5">
                <Label htmlFor="category-slug">Category Slug</Label>
                <Input
                  id="category-slug"
                  className="rounded-xl"
                  {...register("slug")}
                />
                {errors.slug && (
                  <Text
                    variant="small"
                    className="text-destructive"
                  >
                    {errors.slug.message}
                  </Text>
                )}
              </Box>
            </Box>
          </Box>

          <Box className="flex flex-col gap-4">
            <Box>
              <Heading
                as="h2"
                level={5}
              >
                Category form
              </Heading>
              <Text variant="muted">Input fields shown to buyers when ordering.</Text>
            </Box>

            <CategoryFormFieldsBuilder
              control={control}
              register={register}
              errors={errors}
            />
          </Box>

          <Box className="flex flex-col gap-4">
            <Box>
              <Heading
                as="h2"
                level={5}
              >
                Media & description
              </Heading>
              <Text variant="muted">Category logo and description content for the product page.</Text>
            </Box>

            <Controller
              control={control}
              name="logo"
              render={({ field }) => (
                <ImageDropzone
                  id="category-logo"
                  label="Category Logo"
                  caption="3:4 ratio recommended · max display 800×600 px"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.logo?.message}
                />
              )}
            />

            <Box className="flex flex-col gap-1.5">
              <Label htmlFor="category-description">Description</Label>
              <Textarea
                id="category-description"
                className="rounded-xl"
                {...register("description")}
              />
            </Box>
          </Box>

          <Box className="flex flex-col gap-4">
            <Box>
              <Heading
                as="h2"
                level={5}
              >
                SEO
              </Heading>
              <Text variant="muted">Meta tags for the category page on search engines.</Text>
            </Box>

            <Box className="flex flex-col gap-1.5">
              <Label htmlFor="meta-title">Meta Title</Label>
              <Input
                id="meta-title"
                className="rounded-xl"
                placeholder="Title for search results & the browser tab"
                {...register("metaTitle")}
              />
            </Box>

            <Box className="flex flex-col gap-1.5">
              <Label htmlFor="meta-description">Meta Description</Label>
              <Textarea
                id="meta-description"
                className="rounded-xl"
                placeholder="Short summary for search results"
                maxLength={META_DESCRIPTION_MAX}
                {...register("metaDescription")}
              />
              <Box className="flex justify-between">
                <Text variant="small">
                  {metaDescriptionLength}/{META_DESCRIPTION_MAX} characters
                </Text>
                <Text variant="small">{metaDescriptionPercent}% used</Text>
              </Box>
            </Box>

            <Controller
              control={control}
              name="ogImage"
              render={({ field }) => (
                <ImageDropzone
                  id="og-image"
                  label="OG Image"
                  caption="1.91:1 ratio recommended · max display 1200×630 px"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.ogImage?.message}
                />
              )}
            />

            <Box className="flex flex-col gap-1.5">
              <Label htmlFor="meta-keyword">Meta Keyword</Label>
              <Input
                id="meta-keyword"
                className="rounded-xl"
                placeholder="Separate with commas, e.g. top up ml, diamond ml"
                {...register("metaKeywords")}
              />
            </Box>

            <Controller
              control={control}
              name="metaRobots"
              render={({ field }) => (
                <SelectField
                  id="meta-robot"
                  label="Meta Robot"
                  placeholder="Select"
                  options={META_ROBOTS_OPTIONS}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              )}
            />
          </Box>

          <Box className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              Cancel
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
      </DialogContent>
    </Dialog>
  );
}
