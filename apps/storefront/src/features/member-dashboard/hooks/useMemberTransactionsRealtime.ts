import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { echo } from "@/config/echo";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * Live refresh of the member's own transaction history.
 *
 * Subscribes to the private `member.{id}.transactions` channel (authorised so a
 * member can only ever hear their own stream) and invalidates the history query
 * on any status change, so the panel reflects new orders and fulfilment without
 * a manual refresh. No-ops until Echo is configured and the user is known.
 */
export function useMemberTransactionsRealtime(): void {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    if (!echo || !userId) return;

    const channelName = `member.${userId}.transactions`;
    echo.private(channelName).listen(".transaction.updated", () => {
      void queryClient.invalidateQueries({ queryKey: ["member", "transactions"] });
    });

    return () => {
      echo?.leave(channelName);
    };
  }, [userId, queryClient]);
}
