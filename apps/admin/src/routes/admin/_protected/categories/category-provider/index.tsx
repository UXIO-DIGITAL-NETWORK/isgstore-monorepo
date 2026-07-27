import { createFileRoute } from "@tanstack/react-router";
import { CategoryProviderPage } from "@/features/categories";

export const Route = createFileRoute("/admin/_protected/categories/category-provider/")({
  component: CategoryProviderPage,
});
