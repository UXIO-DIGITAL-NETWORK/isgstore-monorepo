import { createFileRoute } from "@tanstack/react-router";
import { CategoryTypeFormPage } from "@/features/categories";

export const Route = createFileRoute("/admin/_protected/categories/category-type/add/")({
  component: CategoryTypeFormPage,
});
