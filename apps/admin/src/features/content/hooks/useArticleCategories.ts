import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { articleCategoriesService, type ArticleCategoryInput } from "../services/articles.service";
import type { ContentListParams } from "../types/content.type";

const KEY = "article-categories";

export const useArticleCategoryList = (params: ContentListParams = {}) =>
  useQuery({
    queryKey: [KEY, "list", params],
    queryFn: () => articleCategoriesService.list(params),
  });

export const useArticleCategory = (id?: string) =>
  useQuery({
    queryKey: [KEY, "detail", id],
    queryFn: () => articleCategoriesService.getById(id as string),
    enabled: Boolean(id),
  });

/** Options for the article form's category select. */
export const useArticleCategoryOptions = () => {
  const { data, isLoading } = useArticleCategoryList({ per_page: 100 });

  const options = useMemo(
    () => (data?.data ?? []).map((category) => ({ value: category.id, label: category.name })),
    [data],
  );

  return { options, isLoading };
};

export const useCreateArticleCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ArticleCategoryInput) => articleCategoriesService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success("Category created");
    },
    onError: () => toast.error("Failed to create category"),
  });
};

export const useUpdateArticleCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ArticleCategoryInput> }) =>
      articleCategoriesService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success("Category updated");
    },
    onError: () => toast.error("Failed to update category"),
  });
};

export const useDeleteArticleCategories = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => articleCategoriesService.remove(id))),
    onSuccess: (_result, ids) => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success(ids.length === 1 ? "Category deleted" : `${ids.length} categories deleted`);
    },
    // The API refuses to delete a category that still holds articles, so the
    // failure here is usually that — say so rather than a generic error.
    onError: () => toast.error("Failed to delete. Categories with articles cannot be removed."),
  });
};
