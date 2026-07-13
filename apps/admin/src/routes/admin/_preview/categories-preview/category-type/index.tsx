import { createFileRoute } from "@tanstack/react-router";
import { CategoryTypePage } from "@/features/categories";

export const Route = createFileRoute("/admin/_preview/categories-preview/category-type/")({
  component: CategoryTypePage,
});
