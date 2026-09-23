import { createFileRoute } from "@tanstack/react-router";
import { MerchantTransactionsPage } from "@/features/merchant";
import { requirePaymentAdmin } from "@/middlewares/authMiddleware";
import {
  filtersFromSearch,
  parseTransactionSearch,
  searchPatchFromFilters,
  type TransactionSearch,
} from "@/lib/transactionSearch";

export const Route = createFileRoute("/app/_protected/payment-admin/transactions/")({
  // Validated, never trusted: an unknown status or type falls back to the
  // unfiltered feed rather than throwing, so a stale bookmark still lands on
  // the page instead of an error boundary.
  validateSearch: (search: Record<string, unknown>): TransactionSearch => parseTransactionSearch(search),
  beforeLoad: () => requirePaymentAdmin(),
  component: RouteComponent,
});

/**
 * The filters live in the URL, so a reload, a Back press and a link pasted into
 * a message all reproduce the same view — which is what the client's own
 * "did this top-up succeed?" question needs.
 */
function RouteComponent() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <MerchantTransactionsPage
      filters={filtersFromSearch(search)}
      page={search.page}
      // replace: refining a filter is not a place to come back to one field at
      // a time. A filter change also resets the page, because the old page
      // number belongs to the old scope.
      onFiltersChange={(patch) =>
        navigate({
          search: (prev) => ({ ...prev, ...searchPatchFromFilters(patch), page: 1 }),
          replace: true,
        })
      }
      onPageChange={(page) => navigate({ search: (prev) => ({ ...prev, page }) })}
    />
  );
}
