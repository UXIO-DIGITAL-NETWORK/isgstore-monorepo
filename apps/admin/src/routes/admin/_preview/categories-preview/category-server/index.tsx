import { createFileRoute } from "@tanstack/react-router";
import { CategoryServerPage } from "@/features/categories";

export const Route = createFileRoute("/admin/_preview/categories-preview/category-server/")({
  component: CategoryServerPage,
});
