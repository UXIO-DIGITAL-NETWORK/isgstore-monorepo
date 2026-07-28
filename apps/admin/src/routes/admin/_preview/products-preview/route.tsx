import { createFileRoute } from "@tanstack/react-router";
import { ProductTabsLayout } from "@/features/products";

export const Route = createFileRoute("/admin/_preview/products-preview")({
  component: ProductTabsLayout,
});
