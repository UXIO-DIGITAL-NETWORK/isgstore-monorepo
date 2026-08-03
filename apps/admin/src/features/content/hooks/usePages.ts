import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { pagesService, type ContentPageInput } from "../services/pages.service";
import type { ContentListParams } from "../types/content.type";

const KEY = "pages";

export const usePageList = (params: ContentListParams) =>
  useQuery({
    queryKey: [KEY, "list", params],
    queryFn: () => pagesService.list(params),
  });

export const usePage = (id?: string) =>
  useQuery({
    queryKey: [KEY, "detail", id],
    queryFn: () => pagesService.getById(id as string),
    enabled: Boolean(id),
  });

export const useCreatePage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ContentPageInput) => pagesService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success("Page created");
    },
    onError: () => toast.error("Failed to create page"),
  });
};

export const useUpdatePage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ContentPageInput> }) => pagesService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success("Page updated");
    },
    onError: () => toast.error("Failed to update page"),
  });
};

/** One mutation for both delete paths — the row menu passes a single id, the
 * toolbar's "Delete (N)" passes the whole selection. */
export const useDeletePages = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => pagesService.remove(id))),
    onSuccess: (_result, ids) => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success(ids.length === 1 ? "Page deleted" : `${ids.length} pages deleted`);
    },
    onError: (_error, ids) => toast.error(ids.length === 1 ? "Failed to delete page" : "Failed to delete pages"),
  });
};
