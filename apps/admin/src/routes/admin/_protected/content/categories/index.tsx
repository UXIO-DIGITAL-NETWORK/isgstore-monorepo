import { createFileRoute } from "@tanstack/react-router";
import { ArticleCategoryListPage } from "@/features/content";

export const Route = createFileRoute("/admin/_protected/content/categories/")({
  component: ArticleCategoryListPage,
});
