import { Controller, useFieldArray, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

import { Box } from "@/components/common/Box";
import { SelectField } from "@/components/common/SelectField";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SUPPLIER_PRODUCT_OPTIONS } from "../data/select-options.data";
import type { ProductFormValues } from "../schemas/productForm.schema";

interface ProductMixBuilderProps {
  control: Control<ProductFormValues>;
  register: UseFormRegister<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
}

/**
 * Repeatable supplier-product rows for the Add form's Product Mix section
 * (product_requirements.md §4.6). Same `useFieldArray` mechanism as the
 * Category form's builders.
 *
 * **The row is inferred, not pictured** — the frame shows only the empty state
 * and the "Add Mix" button. A bundle needs to say *which* upstream SKU and
 * *how many* of it, so that is the row; the remove control follows the
 * Category builders, since a list you can only grow is a dead end.
 */
export function ProductMixBuilder({ control, register, errors }: ProductMixBuilderProps) {
  const { fields, append, remove } = useFieldArray({ control, name: "productMix" });

  return (
    <Box className="flex flex-col gap-3">
      {/* `type="button"`: this fills the field array, it must never submit the
          outer product form. Right-aligned, where the frame puts it. */}
      <Button
        type="button"
        variant="outline"
        className="w-fit self-end rounded-xl"
        onClick={() => append({ supplierProduct: "", quantity: "" })}
      >
        <Plus className="size-4" />
        Add Mix
      </Button>

      {fields.length === 0 ? (
        <Box className="rounded-xl border border-border bg-card p-10 text-center">
          <Text variant="muted">No product mix yet.</Text>
        </Box>
      ) : (
        <Box className="flex flex-col gap-3">
          {fields.map((field, index) => (
            <Box
              key={field.id}
              className="grid grid-cols-1 items-end gap-3 rounded-xl border border-border p-3 sm:grid-cols-[1fr_1fr_auto]"
            >
              <Controller
                control={control}
                name={`productMix.${index}.supplierProduct`}
                render={({ field: select }) => (
                  <SelectField
                    id={`product-mix-supplier-${index}`}
                    label="Supplier Product"
                    options={SUPPLIER_PRODUCT_OPTIONS}
                    value={select.value}
                    onChange={select.onChange}
                    error={errors.productMix?.[index]?.supplierProduct?.message}
                  />
                )}
              />

              <Box className="flex flex-col gap-1.5">
                <Label htmlFor={`product-mix-quantity-${index}`}>Quantity</Label>
                <Input
                  id={`product-mix-quantity-${index}`}
                  className="rounded-xl"
                  inputMode="numeric"
                  placeholder="1"
                  {...register(`productMix.${index}.quantity`)}
                />
                {errors.productMix?.[index]?.quantity && (
                  <Text
                    variant="small"
                    className="text-destructive"
                  >
                    {errors.productMix[index]?.quantity?.message}
                  </Text>
                )}
              </Box>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove mix ${index + 1}`}
                onClick={() => remove(index)}
              >
                <Trash2 className="size-4" />
              </Button>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
