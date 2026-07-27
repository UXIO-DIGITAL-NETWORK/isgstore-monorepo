import { createFileRoute } from "@tanstack/react-router";
import { SubCategoryFormPage } from "@/features/categories";

export const Route = createFileRoute("/admin/_protected/categories/sub-category/add/")({
  component: SubCategoryFormPage,
});
