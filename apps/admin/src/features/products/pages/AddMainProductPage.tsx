import { useLocation, useNavigate } from "@tanstack/react-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Box } from "@/components/common/Box";
import { Can } from "@/components/common/Can";
import { Heading } from "@/components/common/Heading";
import { ImageDropzone } from "@/components/common/ImageDropzone";
import { Link } from "@/components/common/Link";
import { SelectField } from "@/components/common/SelectField";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CATEGORY_OPTIONS,
  NICKNAME_VALIDATION_OPTIONS,
  PRODUCT_ACCESS_OPTIONS,
  PRODUCT_TAG_OPTIONS,
  SUB_CATEGORY_OPTIONS,
} from "../data/select-options.data";
import { useCreateProduct } from "../hooks/useProducts";
import { DESCRIPTION_MAX, productFormSchema, type ProductFormValues } from "../schemas/productForm.schema";

/**
 * Add Main Products (product_requirements.md §4.6) — the reference's field set
 * and layout, in the Add Category shell it was evidently drawn from.
 *
 * Three corrections to that frame, all copy-paste residue from Add Category:
 * the header read "Add Category", the dropzone was labelled "Category Logo",
 * and "Product Acces" is missing an `s`. The counters are one number too — the
 * frame shows "0/280 characters" beside "52% used", which cannot both be true.
 *
 * **No pricing here.** The frame has no cost/price field, so a product created
 * from it starts with no variants; the Add/Edit variant frame is still to come
 * (§5). Nothing is invented to fill that gap.
 */
export default function AddMainProductPage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const listHref = pathname.replace(/\/add\/?$/, "");

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      nicknameValidation: "",
      subName: "",
      code: "",
      access: "",
      tag: "",
      category: "",
      subCategory: "",
      description: "",
    },
  });

  const category = watch("category");
  // Sub categories belong to a category (§6's `SubCategory.category_id`), so
  // the list follows the choice above it rather than offering every entry.
  const subCategoryOptions = SUB_CATEGORY_OPTIONS[category] ?? [];

  const descriptionLength = (watch("description") ?? "").length;
  const descriptionPercent = Math.round((descriptionLength / DESCRIPTION_MAX) * 100);

  const createProduct = useCreateProduct();

  const onSubmit = (values: ProductFormValues) => {
    const selectedCategory = CATEGORY_OPTIONS.find((option) => option.value === values.category);

    createProduct.mutate(
      {
        name: values.name,
        sub_name: values.subName || undefined,
        code: values.code,
        // The form has no Game field; the category carries the game the entity
        // needs denormalized. The real API will join instead.
        game_id: selectedCategory?.game_id ?? "",
        game_name: selectedCategory?.game_name ?? "",
        category_name: values.category,
        sub_category_name: values.subCategory || undefined,
        nickname_validation: values.nicknameValidation || undefined,
        access: values.access || undefined,
        tag: values.tag || undefined,
        description: values.description || undefined,
        status: "active",
        is_available: true,
        // ponytail: file name stands in for the uploaded URL (UI-first, no
        // backend); swap to the URL the §4.9 upload helper returns once it ships.
        image_url: values.logo?.name,
        variants: [],
      },
      { onSuccess: () => navigate({ to: listHref as unknown as string }) },
    );
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
          Add Main Products
        </Heading>
        <Text variant="muted">Create a nominal buyers can purchase, and file it under the game it belongs to.</Text>
      </Box>

      <Box className="divide-y divide-border rounded-2xl border border-border bg-card">
        <Box className="flex flex-col gap-4 p-6">
          <Box>
            <Heading
              as="h2"
              level={5}
            >
              Basic information
            </Heading>
            <Text variant="muted">Product name, code, access, and tags.</Text>
          </Box>

          <Box className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Box className="flex flex-col gap-1.5">
              <Label htmlFor="product-name">Product Name</Label>
              <Input
                id="product-name"
                className="rounded-xl"
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
              name="nicknameValidation"
              render={({ field }) => (
                <SelectField
                  id="product-nickname-validation"
                  label="Nickname Validation"
                  options={NICKNAME_VALIDATION_OPTIONS}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              )}
            />
          </Box>

          <Box className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Box className="flex flex-col gap-1.5">
              <Label htmlFor="product-sub-name">Sub Name</Label>
              <Input
                id="product-sub-name"
                className="rounded-xl"
                {...register("subName")}
              />
            </Box>
            <Box className="flex flex-col gap-1.5">
              <Label htmlFor="product-code">Product Code</Label>
              <Input
                id="product-code"
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
            <Controller
              control={control}
              name="access"
              render={({ field }) => (
                <SelectField
                  id="product-access"
                  label="Product Access"
                  options={PRODUCT_ACCESS_OPTIONS}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              )}
            />
          </Box>

          <Box className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Controller
              control={control}
              name="tag"
              render={({ field }) => (
                <SelectField
                  id="product-tag"
                  label="Product Tag"
                  options={PRODUCT_TAG_OPTIONS}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              )}
            />
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <SelectField
                  id="product-category"
                  label="Category"
                  options={CATEGORY_OPTIONS}
                  value={field.value}
                  onChange={(next) => {
                    field.onChange(next);
                    // The old sub category belongs to the old category.
                    setValue("subCategory", "");
                  }}
                  error={errors.category?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="subCategory"
              render={({ field }) => (
                <SelectField
                  id="product-sub-category"
                  label="Sub Category"
                  options={subCategoryOptions}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  emptyLabel="Choose a category first"
                />
              )}
            />
          </Box>
        </Box>

        <Box className="flex flex-col gap-4 p-6">
          <Box>
            <Heading
              as="h2"
              level={5}
            >
              Media & description
            </Heading>
            <Text variant="muted">Product logo and description shown on the storefront.</Text>
          </Box>

          <Controller
            control={control}
            name="logo"
            render={({ field }) => (
              <ImageDropzone
                id="product-logo"
                label="Product Logo"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                formatsLabel="JPG, JPEG, PNG, WEBP up to 10mb"
                caption="1:1 ratio recommended · max display 512×512 px"
                value={field.value}
                onChange={field.onChange}
                error={errors.logo?.message}
              />
            )}
          />

          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="product-description">Description</Label>
            <Textarea
              id="product-description"
              className="rounded-xl"
              maxLength={DESCRIPTION_MAX}
              {...register("description")}
            />
            {/* Counters are one number, not two: the frame shows "0/280"
                beside "52% used". `tabular-nums` keeps them from jittering as
                the count changes under the cursor. */}
            <Box className="flex justify-between">
              <Text
                variant="small"
                className="tabular-nums"
              >
                {descriptionLength}/{DESCRIPTION_MAX} characters
              </Text>
              <Text
                variant="small"
                className="tabular-nums"
              >
                {descriptionPercent}% used
              </Text>
            </Box>
          </Box>
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
        {/* Creating a product is privileged, so the action is gated rather
            than relying on the route's `products.view` alone. */}
        <Can permission="products.create">
          <Button
            type="submit"
            className="rounded-xl"
            disabled={createProduct.isPending}
          >
            {createProduct.isPending ? "Saving..." : "Save"}
          </Button>
        </Can>
      </Box>
    </Box>
  );
}
