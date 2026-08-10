import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { echo } from "@/config/echo";

/**
 * Live invoice updates over the public `invoice.{invoiceNumber}` channel.
 *
 * The backend broadcasts a minimal signal on every status change; we react by
 * invalidating the invoice query so it refetches through the authorised
 * endpoint (single source of truth). Polling in `useInvoiceQuery` remains as a
 * slow fallback for when the socket is unavailable, so this is purely additive.
 *
 * No-ops when Echo is unconfigured — the page still works on polling alone.
 */
export function useInvoiceRealtime(invoiceNumber: string): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!echo || !invoiceNumber) return;

    const channelName = `invoice.${invoiceNumber}`;
    echo.channel(channelName).listen(".transaction.updated", () => {
      void queryClient.invalidateQueries({ queryKey: ["invoice", invoiceNumber] });
    });

    return () => {
      echo?.leave(channelName);
    };
  }, [invoiceNumber, queryClient]);
}
