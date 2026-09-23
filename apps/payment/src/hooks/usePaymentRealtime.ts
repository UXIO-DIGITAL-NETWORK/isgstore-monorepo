import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { echo } from "@/lib/echo";
import { ROLES } from "@/constants/roles";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * Subscribes the signed-in user to their realtime feeds (hosted Pusher) and
 * invalidates the matching TanStack Query caches on each push — so withdrawals,
 * service invoices and the notification badge update live instead of polling.
 *
 * Channels follow the backend (routes/channels.php):
 *   - payment-internal (kita): finance.withdrawals, finance.service-invoices,
 *     user.{id}.notifications
 *   - payment-admin (merchant): merchant.{id}.withdrawals, merchant.{id}.service-invoices
 *
 * Mount once, high in the authenticated shell (DashboardLayout). A no-op when
 * realtime is disabled (`echo` null) — the query hooks keep their fallback poll.
 */
export function usePaymentRealtime(): void {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;
  const role = user?.role;

  useEffect(() => {
    if (!echo || !userId || !role) return;

    const subscriptions: string[] = [];
    const invalidate = (key: readonly unknown[]) => () => void queryClient.invalidateQueries({ queryKey: key });

    const listen = (channel: string, event: string, handler: () => void) => {
      subscriptions.push(channel);
      echo!.private(channel).listen(event, handler);
    };

    if (role === ROLES.INTERNAL) {
      listen("finance.withdrawals", ".withdrawal.updated", invalidate(["finance", "withdrawals"]));
      listen("finance.service-invoices", ".service-invoice.updated", invalidate(["finance", "service-invoices"]));
      listen(`user.${userId}.notifications`, ".notification.created", invalidate(["finance", "notifications"]));
    } else if (role === ROLES.ADMIN) {
      listen(`merchant.${userId}.withdrawals`, ".withdrawal.updated", () => {
        void queryClient.invalidateQueries({ queryKey: ["merchant", "withdrawals"] });
        // The detail page is keyed separately (["merchant","withdrawal",number]),
        // so it needs its own invalidation — a client watching one payout settle
        // must not have to reload.
        void queryClient.invalidateQueries({ queryKey: ["merchant", "withdrawal"] });
        // A payout settling moves the dashboard's balances, which nothing else
        // in this subscription reports.
        void queryClient.invalidateQueries({ queryKey: ["merchant", "dashboard"] });
      });
      listen(`merchant.${userId}.service-invoices`, ".service-invoice.updated", () => {
        // Covers both the list (["merchant","service-invoices"]) and any open
        // detail (["merchant","service-invoice", id]) — the signal carries no id.
        void queryClient.invalidateQueries({ queryKey: ["merchant", "service-invoices"] });
        void queryClient.invalidateQueries({ queryKey: ["merchant", "service-invoice"] });
      });
      // The client's own feed. The backend has always authorised it
      // (user.{id}.notifications, self-ownership), and the bell's badge interval
      // even assumes it — without this subscription a client's badge could sit
      // two minutes behind a notification that had already arrived.
      listen(`user.${userId}.notifications`, ".notification.created", () =>
        queryClient.invalidateQueries({ queryKey: ["finance", "notifications"] }),
      );
    }

    return () => {
      subscriptions.forEach((channel) => echo?.leave(channel));
    };
  }, [queryClient, userId, role]);
}
