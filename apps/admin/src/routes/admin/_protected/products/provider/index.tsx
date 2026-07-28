import { createFileRoute } from "@tanstack/react-router";
import { ProductProviderPage } from "@/features/products";

export const Route = createFileRoute("/admin/_protected/products/provider/")({
  component: ProductProviderPage,
});
