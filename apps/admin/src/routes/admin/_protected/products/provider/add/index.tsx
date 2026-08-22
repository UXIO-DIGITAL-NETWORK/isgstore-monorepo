import { createFileRoute } from "@tanstack/react-router";
import { ProductProviderPage } from "@/features/products";

/**
 * "Add Product Provider" — the Uxiotopup price list, the source for mapping a
 * new provider product into the catalog. Lives under `/provider/add` so the
 * tabs layout hides the tab bar (an `/add` form route) while the managed list
 * stays at `/provider`.
 */
export const Route = createFileRoute("/admin/_protected/products/provider/add/")({
  component: ProductProviderPage,
});
