import { createFileRoute } from "@tanstack/react-router";
import { ManagedProviderPage } from "@/features/products";

export const Route = createFileRoute("/admin/_protected/products/provider/")({
  component: ManagedProviderPage,
});
