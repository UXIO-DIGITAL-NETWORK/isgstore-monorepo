import { createFileRoute } from "@tanstack/react-router";
import { PriceChangeLogPage } from "@/features/products";

export const Route = createFileRoute("/admin/_protected/products/price-log/")({
  component: PriceChangeLogPage,
});
