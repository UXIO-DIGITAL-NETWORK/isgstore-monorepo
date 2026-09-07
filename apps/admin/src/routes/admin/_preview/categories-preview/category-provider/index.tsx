import { createFileRoute } from "@tanstack/react-router";
import { CategoryProviderPage } from "@/features/categories";

export const Route = createFileRoute("/admin/_preview/categories-preview/category-provider/")({
  component: CategoryProviderPage,
});
