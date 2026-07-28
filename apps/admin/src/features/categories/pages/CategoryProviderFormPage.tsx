import { useLocation, useNavigate, useParams } from "@tanstack/react-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Link } from "@/components/common/Link";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PROVIDER_OPTIONS, PROVIDER_TEMPLATE_OPTIONS } from "../data/select-options.data";
import { useCategoryList } from "../hooks/useCategories";
import {
  useCategoryProvider,
  useCreateCategoryProvider,
  useUpdateCategoryProvider,
} from "../hooks/useCategoryProviders";
import { categoryProviderFormSchema, type CategoryProviderFormValues } from "../schemas/categoryProviderForm.schema";

const CATEGORY_OPTIONS_PAGE_SIZE = 100;
const EMPTY_VALUES: CategoryProviderFormValues = { providerName: "", categoryId: "", providerTemplate: "" };

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
 * Add / Edit Category Provider (product_requirements.md §4.5, line 247) — one
 * form for both, as a page rather than a modal, consistent with every other
 * tab in this feature.
 *
 * **The header is a correction.** The reference's own add page is titled "Add
 * Category Server" (§4.5 line 243), leftover from copy-pasting the tab built
 * immediately before this one — the second of two such leftovers this round,
 * alongside the toolbar button. Its three placeholders are all lorem ipsum;
 * real hints are written here instead.
 */
export default function CategoryProviderFormPage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  // `strict: false` so one component serves both the add route (no params)
  // and the edit route (`$categoryProviderId`).
  const { categoryProviderId } = useParams({ strict: false }) as { categoryProviderId?: string };
  const isEdit = Boolean(categoryProviderId);

  const listHref = isEdit ? pathname.replace(/\/[^/]+\/edit\/?$/, "") : pathname.replace(/\/add\/?$/, "");

  const { data: categories } = useCategoryList({ per_page: CATEGORY_OPTIONS_PAGE_SIZE });
  const { data: existing } = useCategoryProvider(categoryProviderId);

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
          providerName: existing.provider_name,
          categoryId: existing.category_id,
          providerTemplate: existing.provider_template,
        }
      : undefined,
  });

  const onSubmit = (values: CategoryProviderFormValues) => {
    const payload = {
      provider_name: values.providerName,
      category_id: values.categoryId,
      provider_template: values.providerTemplate,
    };
    const onSuccess = () => navigate({ to: listHref as unknown as string });

    if (categoryProviderId) {
      updateCategoryProvider.mutate({ id: categoryProviderId, input: payload }, { onSuccess });
      return;
    }
    createCategoryProvider.mutate(payload, { onSuccess });
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
          {isEdit ? "Edit Category Provider" : "Add Category Provider"}
        </Heading>
        <Text variant="muted">
          {isEdit
            ? "Update which supplier fulfils this category, and the template its orders route through."
            : "Point a category at the upstream supplier that fulfils it, and the template its orders route through."}
        </Text>
      </Box>

      <Box className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
        <Controller
          control={control}
          name="providerName"
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
                  {PROVIDER_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={errors.providerName?.message} />
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
            asChild
            variant="outline"
            className="rounded-xl"
          >
            <Link href={listHref}>Cancel</Link>
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
    </Box>
  );
}
