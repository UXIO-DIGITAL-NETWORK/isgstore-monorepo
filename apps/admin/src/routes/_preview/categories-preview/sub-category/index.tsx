import { createFileRoute } from "@tanstack/react-router";
import { SubCategoryPage } from "@/features/categories";

export const Route = createFileRoute("/_preview/categories-preview/sub-category/")({
  component: SubCategoryPage,
});
