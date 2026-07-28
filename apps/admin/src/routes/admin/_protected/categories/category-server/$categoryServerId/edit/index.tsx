import { createFileRoute } from "@tanstack/react-router";
import { CategoryServerFormPage } from "@/features/categories";

export const Route = createFileRoute("/admin/_protected/categories/category-server/$categoryServerId/edit/")({
  component: CategoryServerFormPage,
});
