import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useProductSelectOptions } from "../hooks/useProductSelectOptions";
import { useAddDigiflazzProduct, useDigiflazzSkuPreview } from "../hooks/useProviderProducts";
import { providerAddSchema, type ProviderAddFormValues } from "../schemas/providerAdd.schema";
import type { DigiflazzPriceListItem } from "../types/product.type";

interface AddProviderProductDialogProps {
  item: DigiflazzPriceListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRICE_FIELDS = [
  { name: "price_member", label: "Member" },
  { name: "price_vip", label: "VIP" },
  { name: "price_reseller", label: "Reseller" },
  { name: "price_agent", label: "Agent" },
] as const;

/**
 * Adds one Digiflazz SKU to the catalog. The admin picks a category (required —
 * the backend never guesses one) and confirms the four tier prices, which are
 * pre-filled from the SKU's suggested prices and re-suggested whenever the
 * category changes (pricing rules are per category).
 */
export function AddProviderProductDialog({ item, open, onOpenChange }: AddProviderProductDialogProps) {
  const addProduct = useAddDigiflazzProduct();

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProviderAddFormValues>({
    resolver: zodResolver(providerAddSchema),
    defaultValues: {
      category_id: "",
      sub_category_id: "",
      name: item?.name ?? "",
      price_member: "",
      price_vip: "",
      price_reseller: "",
      price_agent: "",
      status: true,
    },
  });

  const categoryId = useWatch({ control, name: "category_id" });
  const { categoryOptions, subCategoryOptions } = useProductSelectOptions(categoryId || undefined);
  const { data: preview } = useDigiflazzSkuPreview(item?.buyer_sku_code, item?.type ?? "prepaid", categoryId || undefined);

  // Pre-fill (and re-suggest on category change) the four tier prices. The
  // preview only refetches on sku/type/category change, so a price the admin
  // typed within one category is never clobbered.
  useEffect(() => {
    if (!preview?.suggested_prices) return;
    const suggested = preview.suggested_prices;
    setValue("price_member", String(suggested.price_member));
    setValue("price_vip", String(suggested.price_vip));
    setValue("price_reseller", String(suggested.price_reseller));
    setValue("price_agent", String(suggested.price_agent));
  }, [preview, setValue]);

  if (!item) return null;

  const onSubmit = (values: ProviderAddFormValues) => {
    addProduct.mutate(
      {
        buyer_sku_code: item.buyer_sku_code,
        type: item.type,
        category_id: values.category_id,
        sub_category_id: values.sub_category_id || null,
        name: values.name || undefined,
        price_member: Number(values.price_member),
        price_vip: Number(values.price_vip),
        price_reseller: Number(values.price_reseller),
        price_agent: Number(values.price_agent),
        status: values.status,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add to products</DialogTitle>
          <DialogDescription>
            {item.name} &middot; <Text
              as="span"
              className="tabular-nums"
            >
              {item.buyer_sku_code}
            </Text>
          </DialogDescription>
        </DialogHeader>

        <Box
          as="form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="provider-add-category">Category</Label>
            <Controller
              control={control}
              name="category_id"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id="provider-add-category"
                    className="w-full rounded-xl"
                  >
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.category_id && (
              <Text
                variant="small"
                className="text-destructive"
              >
                {errors.category_id.message}
              </Text>
            )}
          </Box>

          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="provider-add-subcategory">Sub-category (optional)</Label>
            <Controller
              control={control}
              name="sub_category_id"
              render={({ field }) => (
                <Select
                  value={field.value || ""}
                  onValueChange={field.onChange}
                  disabled={!categoryId || subCategoryOptions.length === 0}
                >
                  <SelectTrigger
                    id="provider-add-subcategory"
                    className="w-full rounded-xl"
                  >
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    {subCategoryOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Box>

          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="provider-add-name">Name</Label>
            <Input
              id="provider-add-name"
              className="rounded-xl"
              placeholder={item.name}
              {...register("name")}
            />
          </Box>

          <Box className="grid grid-cols-2 gap-3">
            {PRICE_FIELDS.map((price) => (
              <Box
                key={price.name}
                className="flex flex-col gap-1.5"
              >
                <Label htmlFor={`provider-add-${price.name}`}>{price.label} price</Label>
                <Input
                  id={`provider-add-${price.name}`}
                  inputMode="numeric"
                  className="rounded-xl tabular-nums"
                  {...register(price.name)}
                />
                {errors[price.name] && (
                  <Text
                    variant="small"
                    className="text-destructive"
                  >
                    {errors[price.name]?.message}
                  </Text>
                )}
              </Box>
            ))}
          </Box>

          <Box className="flex items-center gap-2">
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Switch
                  id="provider-add-status"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="provider-add-status">Active on the storefront</Label>
          </Box>

          <DialogFooter>
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
              disabled={addProduct.isPending}
            >
              {addProduct.isPending ? "Adding..." : "Add product"}
            </Button>
          </DialogFooter>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
