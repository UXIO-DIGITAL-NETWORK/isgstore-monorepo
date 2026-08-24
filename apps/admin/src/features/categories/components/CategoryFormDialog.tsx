import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Box } from "@/components/common/Box";
import { FieldLabel, InfoTooltip } from "@/components/common/FieldLabel";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CategoryFormFieldsBuilder } from "./CategoryFormFieldsBuilder";
import { NicknameCheckField } from "./NicknameCheckField";
import { META_ROBOTS_OPTIONS, REGION_OPTIONS } from "../data/select-options.data";
import { useCategory, useCreateCategory, useUpdateCategory } from "../hooks/useCategories";
import { useCategoryTypeOptions } from "../hooks/useCategoryTypeOptions";
import { slugify } from "../lib/slugify";
import {
  categoryFormSchema,
  META_DESCRIPTION_MAX,
  type CategoryFormValues,
} from "../schemas/categoryForm.schema";

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode; absent = add mode. */
  categoryId?: string;
}

/** Fields that live on the first tab — used to jump there when a submit fails. */
const DETAIL_FIELDS = [
  "categoryType",
  "name",
  "code",
  "slug",
  "subName",
  "region",
  "accountNicknameValidation",
  "orderFormFields",
] as const;

/**
 * Add / Edit Category (product_requirements.md §4.5), as a modal. Split into two
 * tabs — "Detail" (identity + the order form) and "Media & SEO" — so each is
 * focused. Both tabs stay mounted (`forceMount`) so form state survives a switch.
 */
export function CategoryFormDialog({ open, onOpenChange, categoryId }: CategoryFormDialogProps) {
  const isEdit = Boolean(categoryId);
  const { data: existing } = useCategory(open ? categoryId : undefined);
  const [activeTab, setActiveTab] = useState<"detail" | "media">("detail");

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
      name: "",
      subName: "",
      accountNicknameValidation: "",
      accountNicknameCheckEnabled: true,
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
          // The id, not the display name — the select and the write both key on it.
          categoryType: existing.type_id,
          name: existing.name,
          subName: existing.sub_name ?? "",
          accountNicknameValidation: existing.account_nickname_validation ?? "",
          accountNicknameCheckEnabled: existing.account_nickname_check_enabled ?? true,
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

  const nicknameCheckEnabled = watch("accountNicknameCheckEnabled");
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
      name: values.name,
      sub_name: values.subName || undefined,
      account_nickname_validation: values.accountNicknameValidation || undefined,
      account_nickname_check_enabled: values.accountNicknameCheckEnabled,
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

  // A failed validation might sit on the tab that isn't showing; jump to it.
  const onInvalid = (formErrors: typeof errors) => {
    const hasDetailError = DETAIL_FIELDS.some((field) => field in formErrors);
    setActiveTab(hasDetailError ? "detail" : "media");
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
          onSubmit={handleSubmit(onSubmit, onInvalid)}
          className="flex flex-col gap-6"
        >
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "detail" | "media")}
          >
            <TabsList className="w-full">
              <TabsTrigger value="detail">Detail</TabsTrigger>
              <TabsTrigger value="media">Media & SEO</TabsTrigger>
            </TabsList>

            {/* ── Tab 1: Detail ── */}
            <TabsContent
              value="detail"
              forceMount
              className="flex flex-col gap-6 data-[state=inactive]:hidden"
            >
              <Box className="flex flex-col gap-4">
                <Box>
                  <Heading
                    as="h2"
                    level={5}
                  >
                    Basic information
                  </Heading>
                  <Text variant="muted">Type, username check, and category identity on the storefront.</Text>
                </Box>

                <Box className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Controller
                    control={control}
                    name="categoryType"
                    render={({ field }) => (
                      <SelectField
                        id="category-type"
                        label="Category Type"
                        tooltip="The kind of catalogue entry (e.g. Mobile Game, PC Game, Voucher). Used to group and filter games on the storefront."
                        options={categoryTypeOptions}
                        disabled={typesLoading}
                        emptyLabel={typesLoading ? "Loading types..." : "No category types available"}
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.categoryType?.message}
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="accountNicknameValidation"
                    render={({ field }) => (
                      <NicknameCheckField
                        enabled={nicknameCheckEnabled}
                        onEnabledChange={(next) =>
                          setValue("accountNicknameCheckEnabled", next, { shouldDirty: true })
                        }
                        value={field.value ?? ""}
                        onChange={field.onChange}
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
                        tooltip="A regional label shown on the storefront (e.g. Southeast Asia, Global). Display only — it does not restrict who can buy."
                        options={REGION_OPTIONS}
                        value={field.value ?? ""}
                        onChange={field.onChange}
                      />
                    )}
                  />

                  <Box className="flex flex-col gap-1.5">
                    <FieldLabel
                      htmlFor="category-name"
                      tooltip="The game/category name buyers see, e.g. “Mobile Legends”."
                    >
                      Category Name
                    </FieldLabel>
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
                    <FieldLabel
                      htmlFor="category-code"
                      tooltip="A unique, stable internal identifier (e.g. mlbb). Used in code and URLs; it cannot clash with another category."
                    >
                      Category Code
                    </FieldLabel>
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
                    <FieldLabel
                      htmlFor="category-sub-name"
                      tooltip="Optional secondary label (e.g. the publisher “Moonton”). Shown next to the name and included in search."
                    >
                      Category Sub Name
                    </FieldLabel>
                    <Input
                      id="category-sub-name"
                      className="rounded-xl"
                      {...register("subName")}
                    />
                  </Box>

                  <Box className="flex flex-col gap-1.5">
                    <FieldLabel
                      htmlFor="category-slug"
                      tooltip="The URL-friendly name used in the storefront address (e.g. mobile-legends). Auto-filled from the name; must be unique."
                    >
                      Category Slug
                    </FieldLabel>
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
                  <Box className="flex items-center gap-1.5">
                    <Heading
                      as="h2"
                      level={5}
                    >
                      Category form
                    </Heading>
                    <InfoTooltip content="The inputs buyers fill in when ordering (e.g. User ID, Server). Field #1 becomes the account id and field #2 the server; these compose the id sent to the supplier." />
                  </Box>
                  <Text variant="muted">Input fields shown to buyers when ordering.</Text>
                </Box>

                <CategoryFormFieldsBuilder
                  control={control}
                  register={register}
                  errors={errors}
                />
              </Box>
            </TabsContent>

            {/* ── Tab 2: Media & SEO ── */}
            <TabsContent
              value="media"
              forceMount
              className="flex flex-col gap-6 data-[state=inactive]:hidden"
            >
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
                  <FieldLabel
                    htmlFor="category-description"
                    tooltip="Long-form copy shown on the game's product page on the storefront."
                  >
                    Description
                  </FieldLabel>
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
                  <FieldLabel
                    htmlFor="meta-title"
                    tooltip="The title shown in search-engine results and the browser tab. Aim for ~60 characters."
                  >
                    Meta Title
                  </FieldLabel>
                  <Input
                    id="meta-title"
                    className="rounded-xl"
                    placeholder="Title for search results & the browser tab"
                    {...register("metaTitle")}
                  />
                </Box>

                <Box className="flex flex-col gap-1.5">
                  <FieldLabel
                    htmlFor="meta-description"
                    tooltip="The short summary search engines show under the title. Kept under 280 characters."
                  >
                    Meta Description
                  </FieldLabel>
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
                  <FieldLabel
                    htmlFor="meta-keyword"
                    tooltip="Comma-separated keywords for search engines, e.g. top up ml, diamond ml."
                  >
                    Meta Keyword
                  </FieldLabel>
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
                      tooltip="Tells search engines whether to index this page and follow its links (e.g. “Index, Follow”)."
                      placeholder="Select"
                      options={META_ROBOTS_OPTIONS}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  )}
                />
              </Box>
            </TabsContent>
          </Tabs>

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
