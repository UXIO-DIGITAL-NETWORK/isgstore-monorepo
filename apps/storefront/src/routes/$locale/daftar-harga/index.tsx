import { createFileRoute } from "@tanstack/react-router";
import { PriceListPage } from "@/features/price-list";

export const Route = createFileRoute("/$locale/daftar-harga/")({
  component: PriceListPage,
});
