import { createFileRoute } from "@tanstack/react-router";
import { PriceChangeLogPage } from "@/features/products";

export const Route = createFileRoute("/admin/_preview/products-preview/price-log/")({
  component: PriceChangeLogPage,
});
