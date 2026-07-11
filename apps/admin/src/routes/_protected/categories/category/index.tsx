import { createFileRoute } from "@tanstack/react-router";
import { CategoryListPage } from "@/features/categories";

export const Route = createFileRoute("/_protected/categories/category/")({
  component: CategoryListPage,
});
