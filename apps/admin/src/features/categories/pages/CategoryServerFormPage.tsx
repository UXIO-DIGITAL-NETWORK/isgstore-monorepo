import { useLocation, useNavigate, useParams } from "@tanstack/react-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Link } from "@/components/common/Link";
import { SelectField } from "@/components/common/SelectField";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CategoryServerOptionsBuilder } from "../components/CategoryServerOptionsBuilder";
import { useCategoryOptions } from "../hooks/useCategoryOptions";
import { useCategoryServer, useCreateCategoryServer, useUpdateCategoryServer } from "../hooks/useCategoryServers";
import { categoryServerFormSchema, type CategoryServerFormValues } from "../schemas/categoryServerForm.schema";

const EMPTY_VALUES: CategoryServerFormValues = { category_id: "", name: "", options: [] };

/**
 * Add / Edit Category Server (product_requirements.md §4.5, line 235) — one
 * form for both, as a page, consistent with every other edit flow here.
 *
 * The reference labels the name field "Category Type Name", a leftover from
 * copy-pasting the Add Category Type form built immediately before it. The
 * label is corrected here, and its placeholder and the header subcopy are
 * real rather than lorem ipsum.
 */
export default function CategoryServerFormPage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  // `strict: false` so one component serves both the add route (no params)
  // and the edit route (`$categoryServerId`).
  const { categoryServerId } = useParams({ strict: false }) as { categoryServerId?: string };
  const isEdit = Boolean(categoryServerId);

  const listHref = isEdit ? pathname.replace(/\/[^/]+\/edit\/?$/, "") : pathname.replace(/\/add\/?$/, "");

  const { data: existing } = useCategoryServer(categoryServerId);
  const { options: categoryOptions, isLoading: categoriesLoading } = useCategoryOptions();
  const createCategoryServer = useCreateCategoryServer();
  const updateCategoryServer = useUpdateCategoryServer();
  const isPending = createCategoryServer.isPending || updateCategoryServer.isPending;

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryServerFormValues>({
    resolver: zodResolver(categoryServerFormSchema),
    defaultValues: EMPTY_VALUES,
    // `values` (not `defaultValues`) so the form re-syncs once the record
    // resolves — on edit it is undefined for the first render.
    values: existing
      ? { category_id: existing.category_id, name: existing.name, options: existing.options }
      : undefined,
  });

  const onSubmit = (values: CategoryServerFormValues) => {
    const payload = { category_id: values.category_id, name: values.name, options: values.options };
    const onSuccess = () => navigate({ to: listHref as unknown as string });

    if (categoryServerId) {
      updateCategoryServer.mutate({ id: categoryServerId, input: payload }, { onSuccess });
      return;
    }
    createCategoryServer.mutate(payload, { onSuccess });
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
          {isEdit ? "Edit Category Server" : "Add Category Server"}
        </Heading>
        <Text variant="muted">
          {isEdit
            ? "Rename this category server or adjust the options buyers can choose from."
            : "Name a set of server or region options buyers can choose from when ordering."}
        </Text>
      </Box>

      <Box className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
        <Controller
          control={control}
          name="category_id"
          render={({ field }) => (
            <SelectField
              id="category-server-category"
              label="Category"
              options={categoryOptions}
              value={field.value}
              onChange={field.onChange}
              error={errors.category_id?.message}
              disabled={categoriesLoading}
              emptyLabel={categoriesLoading ? "Loading categories..." : "No categories available"}
            />
          )}
        />

        <Box className="flex flex-col gap-1.5">
          <Label htmlFor="category-server-name">Category Server Name</Label>
          <Input
            id="category-server-name"
            className="rounded-xl"
            placeholder="e.g. Genshin Impact"
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

        <CategoryServerOptionsBuilder
          control={control}
          register={register}
          errors={errors}
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
