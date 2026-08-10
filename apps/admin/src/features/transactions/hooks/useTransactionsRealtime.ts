import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { echo } from "@/lib/echo";

/**
 * Live back-office transactions feed.
 *
 * Subscribes to the private `admin.transactions` channel (authorised to admins)
 * and invalidates every `["transactions", ...]` query on any create/status
 * change, so the table, status pills, and counts refresh without operator
 * action. The list query also polls slowly as a fallback (see useTransactions),
 * so this is purely additive and no-ops until Echo is configured.
 */
export const useTransactionsRealtime = (): void => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!echo) return;

    const channelName = "admin.transactions";
    echo.private(channelName).listen(".transaction.updated", () => {
      void queryClient.invalidateQueries({ queryKey: ["transactions"] });
    });

    return () => {
      echo?.leave(channelName);
    };
  }, [queryClient]);
};
