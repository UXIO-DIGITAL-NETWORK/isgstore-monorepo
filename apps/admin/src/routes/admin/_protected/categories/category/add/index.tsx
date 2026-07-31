import { createFileRoute } from "@tanstack/react-router";
import { CategoryFormPage } from "@/features/categories";

export const Route = createFileRoute("/admin/_protected/categories/category/add/")({
  component: CategoryFormPage,
});
