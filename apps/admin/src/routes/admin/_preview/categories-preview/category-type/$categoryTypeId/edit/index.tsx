import { createFileRoute } from "@tanstack/react-router";
import { CategoryTypeFormPage } from "@/features/categories";

export const Route = createFileRoute("/admin/_preview/categories-preview/category-type/$categoryTypeId/edit/")({
  component: CategoryTypeFormPage,
});
