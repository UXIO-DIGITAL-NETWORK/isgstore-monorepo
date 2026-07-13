import { createFileRoute } from "@tanstack/react-router";
import { SupplierCategoryPage } from "@/features/categories";

export const Route = createFileRoute("/admin/_preview/categories-preview/supplier-category/")({
  component: SupplierCategoryPage,
});
