import { createFileRoute } from "@tanstack/react-router";
import { CategoryTypePage } from "@/features/categories";

export const Route = createFileRoute("/admin/_protected/categories/category-type/")({
  component: CategoryTypePage,
});
