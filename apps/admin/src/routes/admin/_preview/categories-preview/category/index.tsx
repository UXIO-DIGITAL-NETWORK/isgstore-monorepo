import { createFileRoute } from "@tanstack/react-router";
import { CategoryListPage } from "@/features/categories";

export const Route = createFileRoute("/admin/_preview/categories-preview/category/")({
  component: CategoryListPage,
});
