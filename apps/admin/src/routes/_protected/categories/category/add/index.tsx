import { createFileRoute } from "@tanstack/react-router";
import { AddCategoryPage } from "@/features/categories";

export const Route = createFileRoute("/_protected/categories/category/add/")({
  component: AddCategoryPage,
});
