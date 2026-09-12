import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { echo } from "@/lib/echo";
import { notificationsService } from "@/lib/notifications.service";
import { useAuthStore } from "@/store/useAuthStore";
import { useEchoConnected } from "@/hooks/useEchoConnected";
import type { NotificationListParams } from "@/types/notification.type";

/** Every query and mutation in this feature invalidates under this one root. */
const ROOT = ["notifications"] as const;

/**
 * Live badge.
 *
 * The API already broadcasts `notification.created` on the recipient's own
 * private channel, and `routes/channels.php` already authorises it by
 * self-ownership — so nothing on the server had to change for this. The payload
 * carries only an id: the client refetches through the authorised endpoints
 * rather than trusting a socket frame with the notification's contents.
 *
 * Mounted once, by the navbar bell, so the whole panel holds one subscription.
 */
export const useNotificationsRealtime = (): void => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);

  useEffect(() => {
    if (!echo || !userId) return;

    const channelName = `user.${userId}.notifications`;
    echo.private(channelName).listen(".notification.created", () => {
      void queryClient.invalidateQueries({ queryKey: ROOT });
    });

    return () => {
      echo?.leave(channelName);
    };
  }, [queryClient, userId]);
};

/**
 * The badge count.
 *
 * Realtime is the primary path; the poll is the safety net, slow while the
 * socket is healthy and faster once it has dropped — the same arrangement
 * `useTransactionList` uses, and for the same reason: a constant background
 * refetch on every open admin tab is not worth it for a feed of refund claims
 * and expiring licences.
 */
export const useNotificationUnreadCount = () => {
  const connected = useEchoConnected();

  return useQuery({
    queryKey: [...ROOT, "unread-count"],
    queryFn: notificationsService.unreadCount,
    refetchInterval: connected ? 300_000 : 60_000,
    // A count that failed to load must read as "nothing to show", never as a
    // retry storm behind a silent UI.
    retry: false,
  });
};

export const useNotifications = (params: NotificationListParams) =>
  useQuery({
    queryKey: [...ROOT, "list", params],
    queryFn: () => notificationsService.list(params),
  });

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => notificationsService.markRead(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ROOT }),
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationsService.markAllRead,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ROOT }),
  });
};
