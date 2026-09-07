import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Box } from "@/components/common/Box";
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
import { Label } from "@/components/ui/label";
import { useBanner, useCreateBanner, useUpdateBanner } from "../hooks/useBanners";
import { useContentCategoryOptions } from "../hooks/useContentCategoryOptions";
import { bannerFormSchema, type BannerFormValues } from "../schemas/contentForms.schema";

const GLOBAL = "global";

interface BannerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode; absent = add mode. */
  bannerId?: string;
}

export function BannerFormDialog({ open, onOpenChange, bannerId }: BannerFormDialogProps) {
  const isEdit = Boolean(bannerId);
  const [image, setImage] = useState<File | null>(null);

  const { data: existing } = useBanner(open ? bannerId : undefined);
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
    const onSuccess = () => onOpenChange(false);

    if (bannerId) {
      updateBanner.mutate({ id: bannerId, input: payload }, { onSuccess });
      return;
    }
    createBanner.mutate(payload as never, { onSuccess });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Banner" : "Add Banner"}</DialogTitle>
          <DialogDescription>
            Hero slides on the storefront homepage. A banner whose image is missing is hidden rather than shown broken.
          </DialogDescription>
        </DialogHeader>

        <Box
          as="form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
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
