import { createFileRoute } from "@tanstack/react-router";
import { CategoryFormPage } from "@/features/categories";

export const Route = createFileRoute("/admin/_preview/categories-preview/category/$categoryId/edit/")({
  component: CategoryFormPage,
});
