import { useFieldArray, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CategoryServerFormValues } from "../schemas/categoryServerForm.schema";

interface CategoryServerOptionsBuilderProps {
  control: Control<CategoryServerFormValues>;
  register: UseFormRegister<CategoryServerFormValues>;
  errors: FieldErrors<CategoryServerFormValues>;
}

/**
 * Repeatable Name/Value option list (product_requirements.md §4.5, line
 * 235). Same `useFieldArray` mechanism as `CategoryFormFieldsBuilder`, but
 * simpler — two plain text fields per row, no type or required metadata.
 *
 * The reference shows a single row with no way to remove it; a repeatable
 * list you can only grow is a dead end, so a per-row remove control is added
 * here. Inferred, not pictured.
 */
export function CategoryServerOptionsBuilder({ control, register, errors }: CategoryServerOptionsBuilderProps) {
  const { fields, append, remove } = useFieldArray({ control, name: "options" });

  return (
    <Box className="flex flex-col gap-3">
      {/* Left-aligned, unlike the Category form's right-aligned "Add Form" —
          that's where the reference puts it. */}
      <Button
        type="button"
        variant="outline"
        className="w-fit self-start rounded-xl"
        onClick={() => append({ name: "", value: "" })}
      >
        <Plus className="size-4" />
        Add Option
      </Button>

      {fields.length === 0 ? (
        <Box className="rounded-xl border border-border bg-card p-10 text-center">
          <Text variant="muted">No options yet. Click &quot;Add Option&quot; to add one.</Text>
        </Box>
      ) : (
        <Box className="flex flex-col gap-3">
          {fields.map((field, index) => (
            <Box
              key={field.id}
              className="grid grid-cols-1 items-end gap-3 rounded-xl border border-border p-3 sm:grid-cols-[1fr_1fr_auto]"
            >
              <Box className="flex flex-col gap-1.5">
                <Label htmlFor={`category-server-option-name-${index}`}>Name</Label>
                <Input
                  id={`category-server-option-name-${index}`}
                  className="rounded-xl"
                  placeholder="Asia"
                  {...register(`options.${index}.name`)}
                />
                {errors.options?.[index]?.name && (
                  <Text
                    variant="small"
                    className="text-destructive"
                  >
                    {errors.options[index]?.name?.message}
                  </Text>
                )}
              </Box>

              <Box className="flex flex-col gap-1.5">
                <Label htmlFor={`category-server-option-value-${index}`}>Value</Label>
                <Input
                  id={`category-server-option-value-${index}`}
                  className="rounded-xl"
                  placeholder="os_asia"
                  {...register(`options.${index}.value`)}
                />
                {errors.options?.[index]?.value && (
                  <Text
                    variant="small"
                    className="text-destructive"
                  >
                    {errors.options[index]?.value?.message}
                  </Text>
                )}
              </Box>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove option ${index + 1}`}
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
