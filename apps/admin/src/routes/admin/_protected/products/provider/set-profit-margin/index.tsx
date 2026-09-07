import { createFileRoute } from "@tanstack/react-router";
import { ProviderMarginBulkPage } from "@/features/products";

/**
 * Set Profit Margin (Bulk). The selection rides in `?ids=1,2` so the page is
 * linkable and refresh-safe. An absent/empty param yields an empty selection
 * (the page simply has nothing to save).
 */
export const Route = createFileRoute("/admin/_protected/products/provider/set-profit-margin/")({
  // A single numeric id (`?ids=2`) is coerced to a number by the parser, so
  // stringify rather than type-guard — a multi-id "1,2" stays a string anyway.
  validateSearch: (search: Record<string, unknown>): { ids: string } => ({
    ids: search.ids != null ? String(search.ids) : "",
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { ids } = Route.useSearch();
  const list = ids ? ids.split(",").filter(Boolean) : [];
  return <ProviderMarginBulkPage ids={list} />;
}
