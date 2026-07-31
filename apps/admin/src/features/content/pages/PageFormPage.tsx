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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ContentSectionsBuilder } from "../components/ContentSectionsBuilder";
import { useCreatePage, usePage, useUpdatePage } from "../hooks/usePages";
import { formToIntro, formToSections, introToForm, sectionsToForm } from "../lib/sections";
import { pageFormSchema, type PageFormValues } from "../schemas/contentForms.schema";

const LOCALE_OPTIONS = [
  { value: "id", label: "Indonesian" },
  { value: "en", label: "English" },
];

export function PageFormPage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { pageId } = useParams({ strict: false }) as { pageId?: string };
  const isEdit = Boolean(pageId);

  const listHref = isEdit ? pathname.replace(/\/[^/]+\/edit\/?$/, "") : pathname.replace(/\/add\/?$/, "");

  const { data: existing } = usePage(pageId);
  const createPage = useCreatePage();
  const updatePage = useUpdatePage();
  const isPending = createPage.isPending || updatePage.isPending;

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PageFormValues>({
    resolver: zodResolver(pageFormSchema),
    defaultValues: {
      slug: "",
      locale: "id",
      title: "",
      intro: "",
      sections: [],
      isPublished: true,
      metaTitle: "",
      metaDescription: "",
      metaRobots: "noindex,follow",
    },
    values: existing
      ? {
          slug: existing.slug,
          locale: existing.locale,
          title: existing.title,
          intro: introToForm(existing.intro),
          sections: sectionsToForm(existing.sections),
          isPublished: existing.is_published,
          metaTitle: existing.meta_title ?? "",
          metaDescription: existing.meta_description ?? "",
          metaRobots: existing.meta_robots ?? "",
        }
      : undefined,
  });

  const onSubmit = (values: PageFormValues) => {
    const payload = {
      slug: values.slug,
      locale: values.locale,
      title: values.title,
      intro: formToIntro(values.intro),
      sections: formToSections(values.sections),
      is_published: values.isPublished,
      meta_title: values.metaTitle,
      meta_description: values.metaDescription,
      meta_robots: values.metaRobots,
    };
    const onSuccess = () => navigate({ to: listHref as unknown as string });

    if (pageId) {
      updatePage.mutate({ id: pageId, input: payload }, { onSuccess });
      return;
    }
    createPage.mutate(payload, { onSuccess });
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
          {isEdit ? "Edit Page" : "Add Page"}
        </Heading>
        <Text variant="muted">
          Static pages such as the privacy policy. The slug is the URL the storefront reads it by.
        </Text>
      </Box>

      <Box className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
        <Box className="grid gap-4 sm:grid-cols-3">
          <Box className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="page-title">Title</Label>
            <Input
              id="page-title"
              className="rounded-xl"
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

          <Controller
            control={control}
            name="locale"
            render={({ field }) => (
              <SelectField
                id="page-locale"
                label="Language"
                options={LOCALE_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                error={errors.locale?.message}
              />
            )}
          />
        </Box>

        <Box className="flex flex-col gap-1.5">
          <Label htmlFor="page-slug">Slug</Label>
          <Input
            id="page-slug"
            className="rounded-xl"
            placeholder="e.g. kebijakan-privasi"
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

        <Box className="flex flex-col gap-1.5">
          <Label htmlFor="page-intro">Intro</Label>
          <Textarea
            id="page-intro"
            rows={4}
            className="rounded-xl"
            placeholder="Opening paragraphs, before the first heading. Separate with a blank line."
            {...register("intro")}
          />
        </Box>
      </Box>

      <Box className="rounded-2xl border border-border bg-card p-6">
        <ContentSectionsBuilder
          control={control as never}
          register={register as never}
          errors={errors}
          requireOne={false}
        />
      </Box>

      <Box className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
        <Controller
          control={control}
          name="isPublished"
          render={({ field }) => (
            <Box className="flex items-center gap-3">
              <Switch
                id="page-published"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
              <Label htmlFor="page-published">Published</Label>
            </Box>
          )}
        />

        <Box className="grid gap-4 sm:grid-cols-2">
          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="page-meta-title">Meta Title</Label>
            <Input
              id="page-meta-title"
              className="rounded-xl"
              {...register("metaTitle")}
            />
          </Box>
          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="page-meta-robots">Meta Robots</Label>
            <Input
              id="page-meta-robots"
              className="rounded-xl"
              {...register("metaRobots")}
            />
          </Box>
        </Box>

        <Box className="flex flex-col gap-1.5">
          <Label htmlFor="page-meta-description">Meta Description</Label>
          <Textarea
            id="page-meta-description"
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

export default PageFormPage;
