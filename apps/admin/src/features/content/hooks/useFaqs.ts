import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { faqsService, type FaqInput } from "../services/faqs.service";
import type { ContentListParams } from "../types/content.type";

const KEY = "faqs";

export const useFaqList = (params: ContentListParams) =>
  useQuery({
    queryKey: [KEY, "list", params],
    queryFn: () => faqsService.list(params),
  });

export const useFaq = (id?: string) =>
  useQuery({
    queryKey: [KEY, "detail", id],
    queryFn: () => faqsService.getById(id as string),
    enabled: Boolean(id),
  });

export const useCreateFaq = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: FaqInput) => faqsService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success("FAQ created");
    },
    onError: () => toast.error("Failed to create FAQ"),
  });
};

export const useUpdateFaq = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<FaqInput> }) => faqsService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success("FAQ updated");
    },
    onError: () => toast.error("Failed to update FAQ"),
  });
};

/** One mutation for both delete paths — the row menu passes a single id, the
 * toolbar's "Delete (N)" passes the whole selection. */
export const useDeleteFaqs = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => faqsService.remove(id))),
    onSuccess: (_result, ids) => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success(ids.length === 1 ? "FAQ deleted" : `${ids.length} FAQs deleted`);
    },
    onError: (_error, ids) => toast.error(ids.length === 1 ? "Failed to delete FAQ" : "Failed to delete FAQs"),
  });
};
