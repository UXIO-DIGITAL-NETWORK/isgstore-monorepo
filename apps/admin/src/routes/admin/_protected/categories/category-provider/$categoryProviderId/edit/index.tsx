import { createFileRoute } from "@tanstack/react-router";
import { CategoryProviderFormPage } from "@/features/categories";

export const Route = createFileRoute("/admin/_protected/categories/category-provider/$categoryProviderId/edit/")({
  component: CategoryProviderFormPage,
});
