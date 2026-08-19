import { createFileRoute } from "@tanstack/react-router";
import { MainProductPriceLimitPage } from "@/features/products";

/**
 * Set Price Limit for a single product. The product id rides in `?id=` so the
 * page is linkable and refresh-safe.
 */
export const Route = createFileRoute("/admin/_protected/products/main/set-price-limit/")({
  validateSearch: (search: Record<string, unknown>): { id: string } => ({
    id: search.id != null ? String(search.id) : "",
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useSearch();
  return <MainProductPriceLimitPage id={id} />;
}
