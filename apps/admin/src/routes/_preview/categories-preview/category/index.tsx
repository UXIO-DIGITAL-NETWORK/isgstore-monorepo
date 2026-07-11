import { createFileRoute } from "@tanstack/react-router";
import { CategoryListPage } from "@/features/categories";

export const Route = createFileRoute("/_preview/categories-preview/category/")({
  component: CategoryListPage,
});
