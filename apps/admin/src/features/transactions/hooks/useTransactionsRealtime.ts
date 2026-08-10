import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { echo } from "@/lib/echo";

// Coalesce bursts: one paid order fires ~4 status events in quick succession
// (PENDING→PAID→PROCESSING→COMPLETED). Without throttling, every admin viewing
// the page would refetch the list + counts once per event. Leading+trailing
// throttle → the first event refetches immediately (feels instant), and any
// events within the window collapse into a single trailing refetch.
const THROTTLE_MS = 1500;

/**
 * Live back-office transactions feed.
 *
 * Subscribes to the private `admin.transactions` channel (authorised to admins)
 * and refreshes the transactions list + status counts on create/status change.
 * Only these two active queries are invalidated (not detail/recap/activity-log),
 * and refetches are throttled to keep server load bounded under bursts. No-ops
 * until Echo is configured.
 */
export const useTransactionsRealtime = (): void => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!echo) return;

    let lastRun = 0;
    let trailing: ReturnType<typeof setTimeout> | null = null;

    const refresh = () => {
      lastRun = Date.now();
      void queryClient.invalidateQueries({ queryKey: ["transactions", "list"] });
      void queryClient.invalidateQueries({ queryKey: ["transactions", "status-counts"] });
    };

    const onEvent = () => {
      const elapsed = Date.now() - lastRun;
      if (elapsed >= THROTTLE_MS) {
        refresh(); // leading edge — instant
      } else if (!trailing) {
        trailing = setTimeout(() => {
          trailing = null;
          refresh(); // trailing edge — coalesced burst
        }, THROTTLE_MS - elapsed);
      }
    };

    const channelName = "admin.transactions";
    echo.private(channelName).listen(".transaction.updated", onEvent);

    return () => {
      if (trailing) clearTimeout(trailing);
      echo?.leave(channelName);
    };
  }, [queryClient]);
};
