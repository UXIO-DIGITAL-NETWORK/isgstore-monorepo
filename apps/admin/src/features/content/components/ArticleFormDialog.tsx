import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Box } from "@/components/common/Box";
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
import { Heading } from "@/components/common/Heading";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ContentSectionsBuilder } from "./ContentSectionsBuilder";
import { useArticle, useCreateArticle, useUpdateArticle } from "../hooks/useArticles";
import { useArticleCategoryOptions } from "../hooks/useArticleCategories";
import { formToSections, sectionsToForm } from "../lib/sections";
import { articleFormSchema, type ArticleFormValues } from "../schemas/contentForms.schema";
import type { ArticleType } from "../types/content.type";

const LOCALE_OPTIONS = [
  { value: "id", label: "Indonesian" },
  { value: "en", label: "English" },
];

interface ArticleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: ArticleType;
  /** Present = edit mode; absent = add mode. */
  articleId?: string;
}

/** Add / Edit for both articles and news — one form, the type fixed by prop. */
export function ArticleFormDialog({ open, onOpenChange, type, articleId }: ArticleFormDialogProps) {
  const isEdit = Boolean(articleId);

  const { data: existing } = useArticle(open ? articleId : undefined);
  const { options: categoryOptions, isLoading: categoriesLoading } = useArticleCategoryOptions();
  const createArticle = useCreateArticle();
  const updateArticle = useUpdateArticle();
  const isPending = createArticle.isPending || updateArticle.isPending;

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ArticleFormValues>({
    resolver: zodResolver(articleFormSchema),
    defaultValues: {
      title: "",
      articleCategoryId: "",
      categoryLabel: "",
      type,
      locale: "id",
      slug: "",
      excerpt: "",
      authorName: "Admin_Topupgame",
      sections: [{ heading: "", body: "" }],
      isPublished: true,
      isFeatured: false,
      metaTitle: "",
      metaDescription: "",
      metaRobots: "index,follow",
    },
    // `values` rather than `defaultValues` so the form re-syncs once the
    // record resolves — on edit it is undefined for the first render.
    values: existing
      ? {
          title: existing.title,
          articleCategoryId: existing.article_category_id,
          categoryLabel: existing.category_label ?? "",
          type: existing.type,
          locale: existing.locale,
          slug: existing.slug,
          excerpt: existing.excerpt ?? "",
          authorName: existing.author_name,
          sections: existing.body_sections.length ? sectionsToForm(existing.body_sections) : [{ heading: "", body: "" }],
          isPublished: existing.is_published,
          isFeatured: existing.is_featured,
          metaTitle: existing.meta_title ?? "",
          metaDescription: existing.meta_description ?? "",
          metaRobots: existing.meta_robots ?? "",
        }
      : undefined,
  });

  const onSubmit = (values: ArticleFormValues) => {
    const payload = {
      title: values.title,
      article_category_id: values.articleCategoryId,
      category_label: values.categoryLabel || undefined,
      type: values.type,
      locale: values.locale,
      // Left blank means "derive it from the title" — the API generates a
      // unique slug rather than us guessing one here.
      slug: values.slug || undefined,
      excerpt: values.excerpt,
      author_name: values.authorName,
      body_sections: formToSections(values.sections),
      is_published: values.isPublished,
      is_featured: values.isFeatured,
      meta_title: values.metaTitle,
      meta_description: values.metaDescription,
      meta_robots: values.metaRobots,
    };

    const onSuccess = () => onOpenChange(false);

    if (articleId) {
      updateArticle.mutate({ id: articleId, input: payload }, { onSuccess });
      return;
    }
    createArticle.mutate(payload as never, { onSuccess });
  };

  const entityLabel = type === "news" ? "News" : "Article";

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit ${entityLabel}` : `Add ${entityLabel}`}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the content, publication state and SEO for this entry."
              : "Write a new entry for the storefront. Sections become the body the reader sees."}
          </DialogDescription>
        </DialogHeader>

        <Box
          as="form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-6"
        >
          <Box className="flex flex-col gap-4">
            <Box className="flex flex-col gap-1.5">
              <Label htmlFor="article-title">Title</Label>
              <Input
                id="article-title"
                className="rounded-xl"
                placeholder="e.g. Cara Top Up Diamond Lebih Hemat"
                {...register("title")}
              />
              {errors.title && (
                <Text
                  variant="small"
                  className="text-destructive"
                >
                  {errors.title.message}
                </Text>
              )}
            </Box>

            <Box className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={control}
                name="articleCategoryId"
                render={({ field }) => (
                  <SelectField
                    id="article-category"
                    label="Category"
                    options={categoryOptions}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.articleCategoryId?.message}
                    disabled={categoriesLoading}
                    emptyLabel={categoriesLoading ? "Loading categories..." : "No categories available"}
                  />
                )}
              />

              <Controller
                control={control}
                name="locale"
                render={({ field }) => (
                  <SelectField
                    id="article-locale"
                    label="Language"
                    options={LOCALE_OPTIONS}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.locale?.message}
                  />
                )}
              />
            </Box>

            <Box className="grid gap-4 sm:grid-cols-2">
              <Box className="flex flex-col gap-1.5">
                <Label htmlFor="article-category-label">Badge Label</Label>
                <Input
                  id="article-category-label"
                  className="rounded-xl"
                  placeholder="Optional — defaults to the category name"
                  {...register("categoryLabel")}
                />
                <Text variant="muted">
                  Set this only when the badge should differ from the category, e.g. a PUBG article filed under Lainnya.
                </Text>
              </Box>

              <Box className="flex flex-col gap-1.5">
                <Label htmlFor="article-slug">Slug</Label>
                <Input
                  id="article-slug"
                  className="rounded-xl"
                  placeholder="Optional — generated from the title"
                  {...register("slug")}
                />
              </Box>
            </Box>

            <Box className="flex flex-col gap-1.5">
              <Label htmlFor="article-author">Author</Label>
              <Input
                id="article-author"
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
              <Label htmlFor="article-excerpt">Excerpt</Label>
              <Textarea
                id="article-excerpt"
                rows={3}
                className="rounded-xl"
                placeholder="Short summary shown on the card. Max 300 characters."
                {...register("excerpt")}
              />
              {errors.excerpt && (
                <Text
                  variant="small"
                  className="text-destructive"
                >
                  {errors.excerpt.message}
                </Text>
              )}
            </Box>
          </Box>

          <Box>
            <ContentSectionsBuilder
              control={control as never}
              register={register as never}
              errors={errors}
            />
          </Box>

          <Box className="flex flex-col gap-4">
            <Heading
              level={2}
              variant="subtitle"
            >
              Publication & SEO
            </Heading>

            <Box className="flex flex-col gap-3 sm:flex-row sm:gap-8">
              <Controller
                control={control}
                name="isPublished"
                render={({ field }) => (
                  <Box className="flex items-center gap-3">
                    <Switch
                      id="article-published"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <Label htmlFor="article-published">Published</Label>
                  </Box>
                )}
              />
              <Controller
                control={control}
                name="isFeatured"
                render={({ field }) => (
                  <Box className="flex items-center gap-3">
                    <Switch
                      id="article-featured"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <Label htmlFor="article-featured">Featured</Label>
                  </Box>
                )}
              />
            </Box>

            <Box className="grid gap-4 sm:grid-cols-2">
              <Box className="flex flex-col gap-1.5">
                <Label htmlFor="article-meta-title">Meta Title</Label>
                <Input
                  id="article-meta-title"
                  className="rounded-xl"
                  {...register("metaTitle")}
                />
              </Box>
              <Box className="flex flex-col gap-1.5">
                <Label htmlFor="article-meta-robots">Meta Robots</Label>
                <Input
                  id="article-meta-robots"
                  className="rounded-xl"
                  placeholder="index,follow"
                  {...register("metaRobots")}
                />
              </Box>
            </Box>

            <Box className="flex flex-col gap-1.5">
              <Label htmlFor="article-meta-description">Meta Description</Label>
              <Textarea
                id="article-meta-description"
                rows={3}
                className="rounded-xl"
                {...register("metaDescription")}
              />
              {errors.metaDescription && (
                <Text
                  variant="small"
                  className="text-destructive"
                >
                  {errors.metaDescription.message}
                </Text>
              )}
            </Box>
          </Box>

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
