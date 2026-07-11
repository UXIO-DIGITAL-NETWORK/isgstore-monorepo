import { createFileRoute } from "@tanstack/react-router";
import { AddCategoryPage } from "@/features/categories";

export const Route = createFileRoute("/_preview/categories-preview/category/add/")({
  component: AddCategoryPage,
});
