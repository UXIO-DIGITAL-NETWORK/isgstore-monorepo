import { createFileRoute } from "@tanstack/react-router";
import { MainProductsPage } from "@/features/products";

export const Route = createFileRoute("/admin/_protected/products/main/")({
  component: MainProductsPage,
});
