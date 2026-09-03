import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Box } from "@/components/common/Box";
import { Can } from "@/components/common/Can";
import { FieldLabel } from "@/components/common/FieldLabel";
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
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProductMixBuilder } from "./ProductMixBuilder";
import { NICKNAME_VALIDATION_OPTIONS, PRODUCT_ACCESS_OPTIONS, PRODUCT_TAG_OPTIONS } from "../data/select-options.data";
import { useCreateProduct, useProduct, useUpdateProduct } from "../hooks/useProducts";
import { useProductSelectOptions } from "../hooks/useProductSelectOptions";
import { DESCRIPTION_MAX, productFormSchema, type ProductFormValues } from "../schemas/productForm.schema";

interface MainProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode; absent = add mode. */
  productId?: string;
}

/** The five plain-money fields of Pricing & Margin — Cost, then one selling price per tier. */
const PRICE_FIELDS = [
  { name: "costPrice", id: "product-cost-price", label: "Cost Price" },
  { name: "publicPrice", id: "product-public-price", label: "Public Price" },
  { name: "vipPrice", id: "product-vip-price", label: "VIP Price" },
  { name: "resellerPrice", id: "product-reseller-price", label: "Reseller Price" },
  { name: "agentPrice", id: "product-agent-price", label: "Agent Price" },
] as const satisfies readonly { name: keyof ProductFormValues; id: string; label: string }[];

/**
 * Add / Edit Main Product (product_requirements.md §4.6), as a modal — the
 * create/update flow no longer navigates to its own page.
 *
 * Points and Bonus Points are written: loyalty earning is configured per
 * product here rather than only as one global percentage, and a blank field is
 * what selects that global fallback. The money fields and Product Mix are still
 * captured but not written (a known gap): the service writes prices off
 * `variants[0]`, which stays empty here.
 */
export function MainProductFormDialog({ open, onOpenChange, productId }: MainProductFormDialogProps) {
  const isEdit = Boolean(productId);
  const { data: existing } = useProduct(open ? productId : undefined);

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
      points: "",
      pointsFlat: "",
      discount: "",
      costPrice: "",
      publicPrice: "",
      vipPrice: "",
      resellerPrice: "",
      agentPrice: "",
      productMix: [],
    },
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
          points: existing.point_percent != null ? String(existing.point_percent) : "",
          pointsFlat: existing.point_flat != null ? String(existing.point_flat) : "",
          discount: "",
          costPrice: "",
          publicPrice: "",
          vipPrice: "",
          resellerPrice: "",
          agentPrice: "",
          productMix: [],
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
      category_id: values.category,
      sub_category_id: values.subCategory || undefined,
      nickname_validation: values.nicknameValidation || undefined,
      access: values.access || undefined,
      tag: values.tag || undefined,
      description: values.description || undefined,
      logo: values.logo ?? undefined,
      // Blank means "use the global points settings", so it travels as null
      // rather than 0 — 0 is the admin saying this product earns nothing.
      point_percent: values.points === "" || values.points === undefined ? null : Number(values.points),
      point_flat: values.pointsFlat === "" || values.pointsFlat === undefined ? null : Number(values.pointsFlat),
    };

    const onSuccess = () => onOpenChange(false);

    if (productId) {
      updateProduct.mutate({ id: productId, input: payload }, { onSuccess });
      return;
    }

    createProduct.mutate({ ...payload, status: "active", is_available: true, variants: [] } as never, { onSuccess });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Main Product" : "Add Main Products"}</DialogTitle>
          <DialogDescription>
            Create a nominal buyers can purchase, and file it under the game it belongs to.
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
              <Text variant="muted">Product name, code, access, and tags.</Text>
            </Box>

            <Box className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Box className="flex flex-col gap-1.5">
                <FieldLabel
                  htmlFor="product-name"
                  tooltip="The denomination buyers see, e.g. “86 Diamonds”."
                >
                  Product Name
                </FieldLabel>
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
                    tooltip="Optional per-product override for the account-name lookup. The username check is normally configured on the game/category (its “Cek Username” field), not here."
                    options={NICKNAME_VALIDATION_OPTIONS}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                )}
              />
            </Box>

            <Box className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Box className="flex flex-col gap-1.5">
                <FieldLabel
                  htmlFor="product-sub-name"
                  tooltip="Optional secondary label shown under the product name."
                >
                  Sub Name
                </FieldLabel>
                <Input
                  id="product-sub-name"
                  className="rounded-xl"
                  {...register("subName")}
                />
              </Box>
              <Box className="flex flex-col gap-1.5">
                <FieldLabel
                  htmlFor="product-code"
                  tooltip="A unique internal SKU for this product (e.g. mlbb-86). Must not clash with another product."
                >
                  Product Code
                </FieldLabel>
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
                    tooltip="Who may buy this product — e.g. everyone (public) or a specific member tier."
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
                    tooltip="An optional marketing badge shown on the product (e.g. Hot, Promo)."
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
                    tooltip="The game this product belongs to."
                    options={categoryOptions}
                    disabled={categoriesLoading}
                    emptyLabel={categoriesLoading ? "Loading categories..." : "No categories available"}
                    value={field.value}
                    onChange={(next) => {
                      field.onChange(next);
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
                    tooltip="An optional grouping within the game (e.g. a denomination group). Pick a category first."
                    options={subCategoryOptions}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    emptyLabel="Choose a category first"
                  />
                )}
              />
            </Box>
          </Box>

          <Box className="flex flex-col gap-4">
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

          <Box className="flex flex-col gap-4">
            <Box>
              <Heading
                as="h2"
                level={5}
              >
                Pricing &amp; Margin
              </Heading>
              <Text variant="muted">Cost price and selling price per user segment.</Text>
            </Box>

            <Box className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Box className="flex flex-col gap-1.5">
                <FieldLabel
                  htmlFor="product-points"
                  tooltip="Loyalty points this product earns, as a percentage of the sale. Leave empty to use the global points setting; enter 0 for a product that earns nothing."
                >
                  Points
                </FieldLabel>
                <InputGroup className="rounded-xl">
                  <InputGroupInput
                    id="product-points"
                    inputMode="numeric"
                    placeholder="Global default"
                    {...register("points")}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupText>%</InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
                {errors.points && (
                  <Text
                    variant="small"
                    className="text-destructive"
                  >
                    {errors.points.message}
                  </Text>
                )}
              </Box>

              <Box className="flex flex-col gap-1.5">
                <FieldLabel
                  htmlFor="product-points-flat"
                  tooltip="Flat bonus points added on top of the percentage — what makes a cheap denomination worth anything at all. Leave empty to use the global setting."
                >
                  Bonus Points
                </FieldLabel>
                <InputGroup className="rounded-xl">
                  <InputGroupInput
                    id="product-points-flat"
                    inputMode="numeric"
                    placeholder="Global default"
                    {...register("pointsFlat")}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupText>pts</InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
                {errors.pointsFlat && (
                  <Text
                    variant="small"
                    className="text-destructive"
                  >
                    {errors.pointsFlat.message}
                  </Text>
                )}
              </Box>

              <Box className="flex flex-col gap-1.5">
                <Label htmlFor="product-discount">Discount</Label>
                <InputGroup className="rounded-xl">
                  <InputGroupInput
                    id="product-discount"
                    inputMode="numeric"
                    {...register("discount")}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupText>%</InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
                {errors.discount && (
                  <Text
                    variant="small"
                    className="text-destructive"
                  >
                    {errors.discount.message}
                  </Text>
                )}
              </Box>

              {PRICE_FIELDS.map(({ name, id, label }) => (
                <Box
                  key={id}
                  className="flex flex-col gap-1.5"
                >
                  <Label htmlFor={id}>{label}</Label>
                  <Input
                    id={id}
                    className="rounded-xl tabular-nums"
                    inputMode="numeric"
                    {...register(name)}
                  />
                  {errors[name] && (
                    <Text
                      variant="small"
                      className="text-destructive"
                    >
                      {errors[name]?.message}
                    </Text>
                  )}
                </Box>
              ))}
            </Box>
          </Box>

          <Box className="flex flex-col gap-4">
            <Box>
              <Heading
                as="h2"
                level={5}
              >
                Product Mix
              </Heading>
              <Text variant="muted">Combine supplier products into one bundled price.</Text>
            </Box>

            <ProductMixBuilder
              control={control}
              register={register}
              errors={errors}
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
      </DialogContent>
    </Dialog>
  );
}
