import { createFileRoute } from "@tanstack/react-router";
import { ArticleCategoryFormPage } from "@/features/content";

export const Route = createFileRoute("/admin/_protected/content/categories/add/")({
  component: ArticleCategoryFormPage,
});
