import { useState } from "react";
import { useLocation, useNavigate, useParams } from "@tanstack/react-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { ImageDropzone } from "@/components/common/ImageDropzone";
import { Link } from "@/components/common/Link";
import { SelectField } from "@/components/common/SelectField";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBanner, useCreateBanner, useUpdateBanner } from "../hooks/useBanners";
import { useContentCategoryOptions } from "../hooks/useContentCategoryOptions";
import { bannerFormSchema, type BannerFormValues } from "../schemas/contentForms.schema";

const GLOBAL = "global";

export function BannerFormPage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { bannerId } = useParams({ strict: false }) as { bannerId?: string };
  const isEdit = Boolean(bannerId);
  const [image, setImage] = useState<File | null>(null);

  const listHref = isEdit ? pathname.replace(/\/[^/]+\/edit\/?$/, "") : pathname.replace(/\/add\/?$/, "");

  const { data: existing } = useBanner(bannerId);
  const { options: categoryOptions } = useContentCategoryOptions();
  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();
  const isPending = createBanner.isPending || updateBanner.isPending;

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BannerFormValues>({
    resolver: zodResolver(bannerFormSchema),
    defaultValues: { name: "", link: "", categoryId: GLOBAL },
    values: existing
      ? { name: existing.name, link: existing.link ?? "", categoryId: existing.category_id ?? GLOBAL }
      : undefined,
  });

  const onSubmit = (values: BannerFormValues) => {
    const payload = {
      name: values.name,
      link: values.link || undefined,
      // "global" is a UI-only sentinel; the API treats an absent category as
      // homepage-wide.
      category_id: values.categoryId === GLOBAL ? undefined : values.categoryId,
      image,
    };
    const onSuccess = () => navigate({ to: listHref as unknown as string });

    if (bannerId) {
      updateBanner.mutate({ id: bannerId, input: payload }, { onSuccess });
      return;
    }
    createBanner.mutate(payload as never, { onSuccess });
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
          {isEdit ? "Edit Banner" : "Add Banner"}
        </Heading>
        <Text variant="muted">
          Hero slides on the storefront homepage. A banner whose image is missing is hidden rather than shown broken.
        </Text>
      </Box>

      <Box className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
        <Box className="flex flex-col gap-1.5">
          <Label htmlFor="banner-name">Name</Label>
          <Input
            id="banner-name"
            className="rounded-xl"
            placeholder="e.g. Promo Ramadan 2026"
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

        <Box className="grid gap-4 sm:grid-cols-2">
          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="banner-link">Link</Label>
            <Input
              id="banner-link"
              className="rounded-xl"
              placeholder="https://..."
              {...register("link")}
            />
          </Box>

          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <SelectField
                id="banner-category"
                label="Scope"
                options={[{ value: GLOBAL, label: "Global (all games)" }, ...categoryOptions]}
                value={field.value ?? GLOBAL}
                onChange={field.onChange}
              />
            )}
          />
        </Box>

        <ImageDropzone
          id="banner-image"
          label="Banner Image"
          caption={isEdit ? "Upload to replace the current image." : "Required — the storefront hides a banner with no image."}
          value={image ?? undefined}
          onChange={setImage}
          accept="image/jpeg,image/png,image/webp"
          formatsLabel="JPG, PNG or WEBP up to 2MB"
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

export default BannerFormPage;
