import { createFileRoute } from "@tanstack/react-router";
import { ManagedProviderPage } from "@/features/products";

export const Route = createFileRoute("/admin/_preview/products-preview/provider/")({
  component: ManagedProviderPage,
});
