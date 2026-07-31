import { useLocation, useNavigate, useParams } from "@tanstack/react-router";
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
import { NICKNAME_VALIDATION_OPTIONS, PRODUCT_ACCESS_OPTIONS, PRODUCT_TAG_OPTIONS } from "../data/select-options.data";
import { useCreateProduct, useProduct, useUpdateProduct } from "../hooks/useProducts";
import { useProductSelectOptions } from "../hooks/useProductSelectOptions";
import { DESCRIPTION_MAX, productFormSchema, type ProductFormValues } from "../schemas/productForm.schema";

/**
 * Add / Edit Main Product (product_requirements.md §4.6) — one form for both,
 * as a page, consistent with every other edit flow here.
 *
 * The reference's field set
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
export default function MainProductFormPage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { productId } = useParams({ strict: false }) as { productId?: string };
  const isEdit = Boolean(productId);
  const listHref = isEdit ? pathname.replace(/\/[^/]+\/edit\/?$/, "") : pathname.replace(/\/add\/?$/, "");

  const { data: existing } = useProduct(productId);

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
    // `values` rather than `defaultValues` so the form re-syncs once the record
    // resolves — on edit it is undefined for the first render.
    values: existing
      ? {
          name: existing.name,
          nicknameValidation: existing.nickname_validation ?? "",
          subName: existing.sub_name ?? "",
          code: existing.code,
          access: existing.access ?? "",
          tag: existing.tag ?? "",
          category: existing.game_id,
          subCategory: "",
          description: existing.description ?? "",
        }
      : undefined,
  });

  const category = watch("category");
  const { categoryOptions, subCategoryOptions, categoriesLoading } = useProductSelectOptions(category || undefined);

  const descriptionLength = (watch("description") ?? "").length;
  const descriptionPercent = Math.round((descriptionLength / DESCRIPTION_MAX) * 100);

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const isPending = createProduct.isPending || updateProduct.isPending;

  const onSubmit = (values: ProductFormValues) => {
    const payload = {
      name: values.name,
      sub_name: values.subName || undefined,
      code: values.code,
      // The select submits a real category id, which is what the API's
      // foreign key needs — the previous hardcoded list carried names.
      category_id: values.category,
      sub_category_id: values.subCategory || undefined,
      nickname_validation: values.nicknameValidation || undefined,
      access: values.access || undefined,
      tag: values.tag || undefined,
      description: values.description || undefined,
      logo: values.logo ?? undefined,
    };

    const onSuccess = () => navigate({ to: listHref as unknown as string });

    if (productId) {
      // The service merges onto the fetched row, so the prices this form does
      // not collect survive the write.
      updateProduct.mutate({ id: productId, input: payload }, { onSuccess });
      return;
    }

    createProduct.mutate(
      { ...payload, status: "active", is_available: true, variants: [] } as never,
      { onSuccess },
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
          {isEdit ? "Edit Main Product" : "Add Main Products"}
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
                  options={categoryOptions}
                  disabled={categoriesLoading}
                  emptyLabel={categoriesLoading ? "Loading categories..." : "No categories available"}
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
            disabled={isPending}
          >
            {isPending ? "Saving..." : "Save"}
          </Button>
        </Can>
      </Box>
    </Box>
  );
}
