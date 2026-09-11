import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { articlesService, type ArticleInput } from "../services/articles.service";
import type { ArticleListParams } from "../types/content.type";

const KEY = "articles";

export const useArticleList = (params: ArticleListParams) =>
  useQuery({
    queryKey: [KEY, "list", params],
    queryFn: () => articlesService.list(params),
  });

export const useArticle = (id?: string) =>
  useQuery({
    queryKey: [KEY, "detail", id],
    queryFn: () => articlesService.getById(id as string),
    enabled: Boolean(id),
  });

export const useCreateArticle = () => {
  const { t } = useTranslation("content");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ArticleInput) => articlesService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success(t("articleCreated"));
    },
    onError: () => toast.error(t("articleCreateFailed")),
  });
};

export const useUpdateArticle = () => {
  const { t } = useTranslation("content");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ArticleInput> }) => articlesService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success(t("articleUpdated"));
    },
    onError: () => toast.error(t("articleUpdateFailed")),
  });
};

/** One mutation for both delete paths — the row menu passes a single id, the
 * toolbar's "Delete (N)" passes the whole selection. */
export const useDeleteArticles = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => articlesService.remove(id))),
    onSuccess: (_result, ids) => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success(ids.length === 1 ? "Article deleted" : `${ids.length} articles deleted`);
    },
    onError: (_error, ids) => toast.error(ids.length === 1 ? "Failed to delete article" : "Failed to delete articles"),
  });
};
