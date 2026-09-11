import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { testimonialsService, type TestimonialInput } from "../services/testimonials.service";
import type { ContentListParams } from "../types/content.type";

const KEY = "testimonials";

export const useTestimonialList = (params: ContentListParams) =>
  useQuery({
    queryKey: [KEY, "list", params],
    queryFn: () => testimonialsService.list(params),
  });

export const useTestimonial = (id?: string) =>
  useQuery({
    queryKey: [KEY, "detail", id],
    queryFn: () => testimonialsService.getById(id as string),
    enabled: Boolean(id),
  });

export const useCreateTestimonial = () => {
  const { t } = useTranslation("content");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: TestimonialInput) => testimonialsService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success(t("testimonialCreated"));
    },
    onError: () => toast.error(t("testimonialCreateFailed")),
  });
};

export const useUpdateTestimonial = () => {
  const { t } = useTranslation("content");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<TestimonialInput> }) => testimonialsService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success(t("testimonialUpdated"));
    },
    onError: () => toast.error(t("testimonialUpdateFailed")),
  });
};

/** One mutation for both delete paths — the row menu passes a single id, the
 * toolbar's "Delete (N)" passes the whole selection. */
export const useDeleteTestimonials = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => testimonialsService.remove(id))),
    onSuccess: (_result, ids) => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success(ids.length === 1 ? "Testimonial deleted" : `${ids.length} testimonials deleted`);
    },
    onError: (_error, ids) => toast.error(ids.length === 1 ? "Failed to delete testimonial" : "Failed to delete testimonials"),
  });
};
