import { createFileRoute } from "@tanstack/react-router";
import { CategoryProviderFormPage } from "@/features/categories";

export const Route = createFileRoute("/admin/_preview/categories-preview/category-provider/$categoryProviderId/edit/")({
  component: CategoryProviderFormPage,
});
