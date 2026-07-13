import { createFileRoute } from "@tanstack/react-router";
import { AddCategoryPage } from "@/features/categories";

export const Route = createFileRoute("/admin/_preview/categories-preview/category/add/")({
  component: AddCategoryPage,
});
