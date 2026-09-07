import { useState } from "react";
import { useFieldArray, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CategoryServerFormValues } from "../schemas/categoryServerForm.schema";
import { parseBulkOptions } from "../utils/parseBulkOptions";

const BULK_HINT = "Bulk must be in the correct format. One option per line, as Name=Value.";

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

  // Scratch state, deliberately outside the form: the pasted text is an input
  // to `append`, never part of `CategoryServerFormValues` or the save payload.
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkError, setBulkError] = useState<string | null>(null);

  const handleBulkSubmit = () => {
    const { options, errorLine } = parseBulkOptions(bulkText);

    if (errorLine !== null) {
      setBulkError(`Line ${errorLine} is not in the Name=Value format.`);
      return;
    }
    if (options.length === 0) {
      setBulkError("Add at least one line before submitting.");
      return;
    }

    // Appends rather than replaces, so rows typed by hand survive a paste.
    append(options);
    setBulkText("");
    setBulkError(null);
    setBulkOpen(false);
  };

  return (
    <Box className="flex flex-col gap-3">
      {/* Left-aligned, unlike the Category form's right-aligned "Add Form" —
          that's where the reference puts it. */}
      <Box className="flex flex-wrap items-center gap-2 self-start">
        <Button
          type="button"
          variant="outline"
          className="w-fit rounded-xl"
          onClick={() => append({ name: "", value: "" })}
        >
          <Plus className="size-4" />
          Add Option
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-fit rounded-xl"
          onClick={() => setBulkOpen((open) => !open)}
        >
          <Plus className="size-4" />
          Add Bulk
        </Button>
      </Box>

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

      {/* Below the rows, where the reference puts it — the appended rows
          appear above, which is the confirmation that a paste worked. */}
      {bulkOpen && (
        <Box className="flex flex-col gap-1.5">
          <Box className="flex flex-col gap-3 rounded-xl border border-border p-3">
            <Box className="flex flex-col gap-1.5">
              <Label htmlFor="category-server-bulk">Bulk</Label>
              <Textarea
                id="category-server-bulk"
                className="rounded-xl"
                rows={4}
                placeholder={"ASIA=asia\nEUROPE=europe"}
                value={bulkText}
                onChange={(event) => setBulkText(event.target.value)}
              />
            </Box>
            {/* `type="button"`: this fills the field array, it must never
                submit the outer form. */}
            <Button
              type="button"
              variant="outline"
              className="w-fit self-end rounded-xl"
              onClick={handleBulkSubmit}
            >
              Submit
            </Button>
          </Box>
          <Text
            variant="small"
            className={bulkError ? "text-destructive" : "text-muted-foreground"}
          >
            {bulkError ?? BULK_HINT}
          </Text>
        </Box>
      )}
    </Box>
  );
}
