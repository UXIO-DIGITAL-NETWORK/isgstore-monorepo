import { useLocation, useNavigate } from "@tanstack/react-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Link } from "@/components/common/Link";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CategoryFormFieldsBuilder } from "../components/CategoryFormFieldsBuilder";
import {
  ACCOUNT_NICKNAME_VALIDATION_OPTIONS,
  CATEGORY_TYPE_OPTIONS,
  CATEGORY_UID_PARSER_OPTIONS,
  REGION_OPTIONS,
} from "../data/select-options.data";
import { useCreateCategory } from "../hooks/useCategories";
import { categoryFormSchema, type CategoryFormValues } from "../schemas/categoryForm.schema";
import type { SelectOption } from "../types/category.type";

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function SelectField({
  id,
  label,
  options,
  value,
  onChange,
  error,
}: {
  id: string;
  label: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <Box className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value}
        onValueChange={onChange}
      >
        <SelectTrigger
          id={id}
          className="w-full rounded-xl"
        >
          <SelectValue placeholder="Type to search..." />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <Text
          variant="small"
          className="text-destructive"
        >
          {error}
        </Text>
      )}
    </Box>
  );
}

export default function AddCategoryPage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const listHref = pathname.replace(/\/add\/?$/, "");

  const {
    control,
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      categoryType: "",
      uidParser: "",
      name: "",
      subName: "",
      accountNicknameValidation: "",
      region: "",
      code: "",
      slug: "",
      orderFormFields: [],
    },
  });

  const createCategory = useCreateCategory();

  const handleNameBlur = () => {
    const { name, slug } = getValues();
    if (name && !slug) setValue("slug", slugify(name));
  };

  const onSubmit = (values: CategoryFormValues) => {
    createCategory.mutate(
      {
        type: values.categoryType,
        uid_parser: values.uidParser,
        name: values.name,
        sub_name: values.subName || undefined,
        account_nickname_validation: values.accountNicknameValidation || undefined,
        region: values.region || undefined,
        code: values.code,
        slug: values.slug,
        status: "active",
        order_form_fields: values.orderFormFields,
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
          Add Category
        </Heading>
        <Text variant="muted">Define a new taxonomy entry games and products can be grouped under.</Text>
      </Box>

      <Box className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
        <Box>
          <Heading
            as="h2"
            level={5}
          >
            Basic information
          </Heading>
          <Text variant="muted">Type, validation, and category identity on the storefront.</Text>
        </Box>

        <Box className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="categoryType"
            render={({ field }) => (
              <SelectField
                id="category-type"
                label="Category Type"
                options={CATEGORY_TYPE_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                error={errors.categoryType?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="accountNicknameValidation"
            render={({ field }) => (
              <SelectField
                id="account-nickname-validation"
                label="Account Nickname Validation"
                options={ACCOUNT_NICKNAME_VALIDATION_OPTIONS}
                value={field.value ?? ""}
                onChange={field.onChange}
              />
            )}
          />

          <Controller
            control={control}
            name="uidParser"
            render={({ field }) => (
              <SelectField
                id="category-uid-parser"
                label="Category UID Parser"
                options={CATEGORY_UID_PARSER_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                error={errors.uidParser?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="region"
            render={({ field }) => (
              <SelectField
                id="category-region"
                label="Region"
                options={REGION_OPTIONS}
                value={field.value ?? ""}
                onChange={field.onChange}
              />
            )}
          />

          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="category-name">Category Name</Label>
            <Input
              id="category-name"
              className="rounded-xl"
              {...register("name", { onBlur: handleNameBlur })}
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
          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="category-code">Category Code</Label>
            <Input
              id="category-code"
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

          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="category-sub-name">Category Sub Name</Label>
            <Input
              id="category-sub-name"
              className="rounded-xl"
              {...register("subName")}
            />
          </Box>
          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="category-slug">Category Slug</Label>
            <Input
              id="category-slug"
              className="rounded-xl"
              {...register("slug")}
            />
            {errors.slug && (
              <Text
                variant="small"
                className="text-destructive"
              >
                {errors.slug.message}
              </Text>
            )}
          </Box>
        </Box>
      </Box>

      <Box className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
        <Box>
          <Heading
            as="h2"
            level={5}
          >
            Category form
          </Heading>
          <Text variant="muted">Input fields shown to buyers when ordering.</Text>
        </Box>

        <CategoryFormFieldsBuilder
          control={control}
          register={register}
          errors={errors}
        />
      </Box>

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
          disabled={createCategory.isPending}
        >
          {createCategory.isPending ? "Saving..." : "Save"}
        </Button>
      </Box>
    </Box>
  );
}
