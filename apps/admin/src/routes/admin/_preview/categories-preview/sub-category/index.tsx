import { createFileRoute } from "@tanstack/react-router";
import { SubCategoryPage } from "@/features/categories";

export const Route = createFileRoute("/admin/_preview/categories-preview/sub-category/")({
  component: SubCategoryPage,
});
