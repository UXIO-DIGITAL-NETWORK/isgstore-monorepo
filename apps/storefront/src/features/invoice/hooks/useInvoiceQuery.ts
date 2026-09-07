import { useQuery } from "@tanstack/react-query";
import { invoiceService } from "../services/invoice.service";
import { useEchoConnected } from "@/hooks/useEchoConnected";
import type { InvoiceModel } from "@/types/models/transaction.model";

// Realtime (see useInvoiceRealtime) is the primary path. Poll only as a safety
// net: a slow self-heal while the socket is healthy (in case a push is missed),
// faster when it has dropped. Stops entirely once the status is terminal.
const POLL_CONNECTED_MS = 60000;
const POLL_DISCONNECTED_MS = 15000;

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
export const useInvoiceQuery = (invoiceNumber: string) => {
  const connected = useEchoConnected();

  return useQuery<InvoiceModel>({
    queryKey: ["invoice", invoiceNumber],
    queryFn: async () => {
      const response = await invoiceService.show(invoiceNumber);
      return response.data;
    },
    enabled: Boolean(invoiceNumber),
    refetchInterval: (query) =>
      query.state.data?.is_terminal ? false : connected ? POLL_CONNECTED_MS : POLL_DISCONNECTED_MS,
    // Keep polling while the customer is paying in another tab or app.
    refetchIntervalInBackground: true,
    // A freshly-created invoice may 404 for a moment on a read replica; a
    // wrong invoice number in the URL should still fail fast.
    retry: 1,
  });
};
