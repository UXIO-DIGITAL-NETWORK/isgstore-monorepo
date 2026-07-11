import { createFileRoute } from "@tanstack/react-router";
import { SupplierCategoryPage } from "@/features/categories";

export const Route = createFileRoute("/_protected/categories/supplier-category/")({
  component: SupplierCategoryPage,
});
