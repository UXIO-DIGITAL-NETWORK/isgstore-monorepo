import { createFileRoute } from "@tanstack/react-router";
import { RefundClaimPage } from "@/features/refund";

export const Route = createFileRoute("/$locale/refund/")({
  // `token` arrives from the emailed claim link; `invoice` pre-fills the lookup
  // when the customer comes from their failed invoice page.
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : undefined,
    invoice: typeof search.invoice === "string" ? search.invoice : undefined,
  }),
  component: RefundClaimPage,
});
