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
import { useCreateFaq, useFaq, useUpdateFaq } from "../hooks/useFaqs";
import { faqFormSchema, type FaqFormValues } from "../schemas/contentForms.schema";

const LOCALE_OPTIONS = [
  { value: "id", label: "Indonesian" },
  { value: "en", label: "English" },
];

export function FaqFormPage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { faqId } = useParams({ strict: false }) as { faqId?: string };
  const isEdit = Boolean(faqId);

  const listHref = isEdit ? pathname.replace(/\/[^/]+\/edit\/?$/, "") : pathname.replace(/\/add\/?$/, "");

  const { data: existing } = useFaq(faqId);
  const createFaq = useCreateFaq();
  const updateFaq = useUpdateFaq();
  const isPending = createFaq.isPending || updateFaq.isPending;

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FaqFormValues>({
    resolver: zodResolver(faqFormSchema),
    defaultValues: { question: "", answer: "", group: "", locale: "id", sortOrder: 0, isActive: true },
    values: existing
      ? {
          question: existing.question,
          answer: existing.answer,
          group: existing.group ?? "",
          locale: existing.locale,
          sortOrder: existing.sort_order,
          isActive: existing.is_active,
        }
      : undefined,
  });

  const onSubmit = (values: FaqFormValues) => {
    const payload = {
      question: values.question,
      answer: values.answer,
      group: values.group || undefined,
      locale: values.locale,
      sort_order: values.sortOrder,
      is_active: values.isActive,
    };
    const onSuccess = () => navigate({ to: listHref as unknown as string });

    if (faqId) {
      updateFaq.mutate({ id: faqId, input: payload }, { onSuccess });
      return;
    }
    createFaq.mutate(payload, { onSuccess });
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
          {isEdit ? "Edit FAQ" : "Add FAQ"}
        </Heading>
        <Text variant="muted">
          Questions appear on the storefront's help page in the order set below, filtered by language.
        </Text>
      </Box>

      <Box className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
        <Box className="flex flex-col gap-1.5">
          <Label htmlFor="faq-question">Question</Label>
          <Input
            id="faq-question"
            className="rounded-xl"
            placeholder="e.g. Berapa lama proses top up berlangsung?"
            {...register("question")}
          />
          {errors.question && (
            <Text
              variant="small"
              className="text-destructive"
            >
              {errors.question.message}
            </Text>
          )}
        </Box>

        <Box className="flex flex-col gap-1.5">
          <Label htmlFor="faq-answer">Answer</Label>
          <Textarea
            id="faq-answer"
            rows={5}
            className="rounded-xl"
            {...register("answer")}
          />
          {errors.answer && (
            <Text
              variant="small"
              className="text-destructive"
            >
              {errors.answer.message}
            </Text>
          )}
        </Box>

        <Box className="grid gap-4 sm:grid-cols-3">
          <Controller
            control={control}
            name="locale"
            render={({ field }) => (
              <SelectField
                id="faq-locale"
                label="Language"
                options={LOCALE_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                error={errors.locale?.message}
              />
            )}
          />
          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="faq-group">Group</Label>
            <Input
              id="faq-group"
              className="rounded-xl"
              placeholder="Optional"
              {...register("group")}
            />
          </Box>
          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="faq-sort">Order</Label>
            <Input
              id="faq-sort"
              type="number"
              min={0}
              className="rounded-xl tabular-nums"
              {...register("sortOrder", { valueAsNumber: true })}
            />
          </Box>
        </Box>

        <Controller
          control={control}
          name="isActive"
          render={({ field }) => (
            <Box className="flex items-center gap-3">
              <Switch
                id="faq-active"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
              <Label htmlFor="faq-active">Active</Label>
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

export default FaqFormPage;
