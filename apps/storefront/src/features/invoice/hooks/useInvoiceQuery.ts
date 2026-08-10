import { useQuery } from "@tanstack/react-query";
import { invoiceService } from "../services/invoice.service";
import type { InvoiceModel } from "@/types/models/transaction.model";

// Realtime (see useInvoiceRealtime) is now the primary path; this poll is the
// fallback for when the WebSocket is unavailable, so it can run far slower than
// the original 5s.
const POLL_INTERVAL_MS = 20000;

/**
 * Live invoice status.
 *
 * Payment confirmation arrives at the backend as a Monetapay webhook, which the
 * browser cannot observe. It reaches this page in real time via Reverb
 * (`useInvoiceRealtime`); this query additionally polls as a fallback until the
 * status is terminal, then stops. `is_terminal` comes from the API rather than
 * being re-derived here, so the client can't disagree with the server about
 * when an order is finished.
 */
export const useInvoiceQuery = (invoiceNumber: string) =>
  useQuery<InvoiceModel>({
    queryKey: ["invoice", invoiceNumber],
    queryFn: async () => {
      const response = await invoiceService.show(invoiceNumber);
      return response.data;
    },
    enabled: Boolean(invoiceNumber),
    refetchInterval: (query) => (query.state.data?.is_terminal ? false : POLL_INTERVAL_MS),
    // Keep polling while the customer is paying in another tab or app.
    refetchIntervalInBackground: true,
    // A freshly-created invoice may 404 for a moment on a read replica; a
    // wrong invoice number in the URL should still fail fast.
    retry: 1,
  });
