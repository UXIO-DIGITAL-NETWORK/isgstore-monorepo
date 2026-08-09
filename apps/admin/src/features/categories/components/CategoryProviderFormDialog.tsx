import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PROVIDER_TEMPLATE_OPTIONS } from "../data/select-options.data";
import { useSupplierOptions } from "../hooks/useSupplierOptions";
import { useCategoryList } from "../hooks/useCategories";
import {
  useCategoryProvider,
  useCreateCategoryProvider,
  useUpdateCategoryProvider,
} from "../hooks/useCategoryProviders";
import { categoryProviderFormSchema, type CategoryProviderFormValues } from "../schemas/categoryProviderForm.schema";

const CATEGORY_OPTIONS_PAGE_SIZE = 100;
const EMPTY_VALUES: CategoryProviderFormValues = { supplierId: "", categoryId: "", providerTemplate: "" };

interface CategoryProviderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode; absent = add mode. */
  categoryProviderId?: string;
}

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
 * Add / Edit Category Provider (product_requirements.md §4.5, line 247), as a
 * modal. The reference's own add page is titled "Add Category Server"; the
 * correct "Add Category Provider" title is used here.
 */
export function CategoryProviderFormDialog({
  open,
  onOpenChange,
  categoryProviderId,
}: CategoryProviderFormDialogProps) {
  const isEdit = Boolean(categoryProviderId);

  const { data: categories } = useCategoryList({ per_page: CATEGORY_OPTIONS_PAGE_SIZE });
  const { data: existing } = useCategoryProvider(open ? categoryProviderId : undefined);

  const { options: supplierOptions } = useSupplierOptions();
  const createCategoryProvider = useCreateCategoryProvider();
  const updateCategoryProvider = useUpdateCategoryProvider();
  const isPending = createCategoryProvider.isPending || updateCategoryProvider.isPending;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryProviderFormValues>({
    resolver: zodResolver(categoryProviderFormSchema),
    defaultValues: EMPTY_VALUES,
    // `values` (not `defaultValues`) so the form re-syncs once the record
    // resolves — on edit it is undefined for the first render.
    values: existing
      ? {
          supplierId: existing.supplier_id ?? "",
          categoryId: existing.category_id,
          providerTemplate: existing.provider_template,
        }
      : undefined,
  });

  const onSubmit = (values: CategoryProviderFormValues) => {
    const payload = {
      supplier_id: values.supplierId,
      category_id: values.categoryId,
      provider_template: values.providerTemplate,
    };
    const onSuccess = () => onOpenChange(false);

    if (categoryProviderId) {
      updateCategoryProvider.mutate({ id: categoryProviderId, input: payload }, { onSuccess });
      return;
    }
    createCategoryProvider.mutate(payload, { onSuccess });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Category Provider" : "Add Category Provider"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update which supplier fulfils this category, and the template its orders route through."
              : "Point a category at the upstream supplier that fulfils it, and the template its orders route through."}
          </DialogDescription>
        </DialogHeader>

        <Box
          as="form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <Controller
            control={control}
            name="supplierId"
            render={({ field }) => (
              <Box className="flex flex-col gap-1.5">
                <Label htmlFor="category-provider-provider">Provider</Label>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id="category-provider-provider"
                    className="w-full rounded-xl"
                  >
                    <SelectValue placeholder="Select a provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {supplierOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError message={errors.supplierId?.message} />
              </Box>
            )}
          />

          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <Box className="flex flex-col gap-1.5">
                <Label htmlFor="category-provider-category">Category</Label>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id="category-provider-category"
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

          <Controller
            control={control}
            name="providerTemplate"
            render={({ field }) => (
              <Box className="flex flex-col gap-1.5">
                <Label htmlFor="category-provider-template">Provider Template</Label>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id="category-provider-template"
                    className="w-full rounded-xl"
                  >
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDER_TEMPLATE_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError message={errors.providerTemplate?.message} />
              </Box>
            )}
          />

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
