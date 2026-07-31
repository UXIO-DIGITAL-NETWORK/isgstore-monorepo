import { useState } from "react";
import { useLocation, useNavigate, useParams } from "@tanstack/react-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { ImageDropzone } from "@/components/common/ImageDropzone";
import { Link } from "@/components/common/Link";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCreateTestimonial, useTestimonial, useUpdateTestimonial } from "../hooks/useTestimonials";
import { testimonialFormSchema, type TestimonialFormValues } from "../schemas/contentForms.schema";

export function TestimonialFormPage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { testimonialId } = useParams({ strict: false }) as { testimonialId?: string };
  const isEdit = Boolean(testimonialId);
  const [avatar, setAvatar] = useState<File | null>(null);

  const listHref = isEdit ? pathname.replace(/\/[^/]+\/edit\/?$/, "") : pathname.replace(/\/add\/?$/, "");

  const { data: existing } = useTestimonial(testimonialId);
  const createTestimonial = useCreateTestimonial();
  const updateTestimonial = useUpdateTestimonial();
  const isPending = createTestimonial.isPending || updateTestimonial.isPending;

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TestimonialFormValues>({
    resolver: zodResolver(testimonialFormSchema),
    defaultValues: {
      authorName: "",
      authorTitle: "",
      content: "",
      rating: 5,
      gameName: "",
      isFeatured: false,
      sortOrder: 0,
      isActive: true,
    },
    values: existing
      ? {
          authorName: existing.author_name,
          authorTitle: existing.author_title ?? "",
          content: existing.content,
          rating: existing.rating ?? 5,
          gameName: existing.game_name ?? "",
          isFeatured: existing.is_featured,
          sortOrder: existing.sort_order,
          isActive: existing.is_active,
        }
      : undefined,
  });

  const onSubmit = (values: TestimonialFormValues) => {
    const payload = {
      author_name: values.authorName,
      author_title: values.authorTitle || undefined,
      content: values.content,
      rating: values.rating,
      game_name: values.gameName || undefined,
      is_featured: values.isFeatured,
      sort_order: values.sortOrder,
      is_active: values.isActive,
      avatar,
    };
    const onSuccess = () => navigate({ to: listHref as unknown as string });

    if (testimonialId) {
      updateTestimonial.mutate({ id: testimonialId, input: payload }, { onSuccess });
      return;
    }
    createTestimonial.mutate(payload as never, { onSuccess });
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
          {isEdit ? "Edit Testimonial" : "Add Testimonial"}
        </Heading>
        <Text variant="muted">
          Curated quotes for marketing surfaces. These are editorial — real purchase reviews live under Transactions.
        </Text>
      </Box>

      <Box className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
        <Box className="grid gap-4 sm:grid-cols-2">
          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="testimonial-author">Author Name</Label>
            <Input
              id="testimonial-author"
              className="rounded-xl"
              {...register("authorName")}
            />
            {errors.authorName && (
              <Text
                variant="small"
                className="text-destructive"
              >
                {errors.authorName.message}
              </Text>
            )}
          </Box>
          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="testimonial-title">Author Title</Label>
            <Input
              id="testimonial-title"
              className="rounded-xl"
              placeholder="e.g. Mobile Legends Player"
              {...register("authorTitle")}
            />
          </Box>
        </Box>

        <Box className="flex flex-col gap-1.5">
          <Label htmlFor="testimonial-content">Testimonial</Label>
          <Textarea
            id="testimonial-content"
            rows={4}
            className="rounded-xl"
            {...register("content")}
          />
          {errors.content && (
            <Text
              variant="small"
              className="text-destructive"
            >
              {errors.content.message}
            </Text>
          )}
        </Box>

        <Box className="grid gap-4 sm:grid-cols-3">
          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="testimonial-game">Game</Label>
            <Input
              id="testimonial-game"
              className="rounded-xl"
              {...register("gameName")}
            />
          </Box>
          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="testimonial-rating">Rating (1-5)</Label>
            <Input
              id="testimonial-rating"
              type="number"
              min={1}
              max={5}
              className="rounded-xl tabular-nums"
              {...register("rating", { valueAsNumber: true })}
            />
            {errors.rating && (
              <Text
                variant="small"
                className="text-destructive"
              >
                {errors.rating.message}
              </Text>
            )}
          </Box>
          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="testimonial-sort">Order</Label>
            <Input
              id="testimonial-sort"
              type="number"
              min={0}
              className="rounded-xl tabular-nums"
              {...register("sortOrder", { valueAsNumber: true })}
            />
          </Box>
        </Box>

        <ImageDropzone
          id="testimonial-avatar"
          label="Avatar"
          caption="Optional. Shown beside the quote on the storefront."
          value={avatar ?? undefined}
          onChange={setAvatar}
          accept="image/jpeg,image/png,image/webp"
          formatsLabel="JPG, PNG or WEBP up to 2MB"
        />

        <Box className="flex flex-col gap-3 sm:flex-row sm:gap-8">
          <Controller
            control={control}
            name="isFeatured"
            render={({ field }) => (
              <Box className="flex items-center gap-3">
                <Switch
                  id="testimonial-featured"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <Label htmlFor="testimonial-featured">Featured</Label>
              </Box>
            )}
          />
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <Box className="flex items-center gap-3">
                <Switch
                  id="testimonial-active"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <Label htmlFor="testimonial-active">Active</Label>
              </Box>
            )}
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
            disabled={isPending}
          >
            {isPending ? "Saving..." : "Save"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default TestimonialFormPage;
