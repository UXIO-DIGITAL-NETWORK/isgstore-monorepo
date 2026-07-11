import { createFileRoute } from "@tanstack/react-router";
import { SubCategoryPage } from "@/features/categories";

export const Route = createFileRoute("/_protected/categories/sub-category/")({
  component: SubCategoryPage,
});
