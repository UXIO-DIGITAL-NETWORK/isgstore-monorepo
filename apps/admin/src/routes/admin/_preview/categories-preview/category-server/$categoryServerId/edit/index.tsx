import { createFileRoute } from "@tanstack/react-router";
import { CategoryServerFormPage } from "@/features/categories";

export const Route = createFileRoute("/admin/_preview/categories-preview/category-server/$categoryServerId/edit/")({
  component: CategoryServerFormPage,
});
