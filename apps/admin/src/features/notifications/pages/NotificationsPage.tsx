import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Bell, CalendarClock, RotateCcw } from "lucide-react";
import type { ComponentType } from "react";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/utils/date";

import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationUnreadCount,
  useNotifications,
} from "@/hooks/useNotifications";
import type { AdminNotification } from "@/types/notification.type";

const ICONS: Record<string, ComponentType<{ className?: string }>> = {
  "refund.claimed": RotateCcw,
  subscription_expiring: CalendarClock,
};

const PAGE_SIZE = 20;

/**
 * The full notification feed — what the bell's dropdown is a preview of.
 *
 * Read state is per recipient: the table holds one row per person, so marking
 * one read here never clears it from anybody else's badge.
 */
export default function NotificationsPage() {
  const { t } = useTranslation("notifications");
  const [unreadOnly, setUnreadOnly] = useState(false);

  const params = useMemo(
    () => ({ per_page: PAGE_SIZE, ...(unreadOnly ? { filter: "unread" as const } : {}) }),
    [unreadOnly],
  );

  const { data, isLoading } = useNotifications(params);
  const { data: unreadCount = 0 } = useNotificationUnreadCount();
  const markAll = useMarkAllNotificationsRead();

  const rows = data?.data ?? [];

  return (
    <Box className="flex flex-col gap-6">
      <Box className="rounded-2xl border border-border bg-card p-6">
        <Heading
          level={1}
          variant="section"
        >{t("page.title")}</Heading>
        <Text variant="muted">{t("page.subtitle")}</Text>
      </Box>

      <Box className="rounded-2xl border border-border bg-card p-4">
        <Box className="flex flex-wrap items-center justify-between gap-2 pb-4">
          <Box className="flex gap-2">
            <Button
              variant={unreadOnly ? "ghost" : "secondary"}
              size="sm"
              onClick={() => setUnreadOnly(false)}
            >
              {t("page.all")}
            </Button>
            <Button
              variant={unreadOnly ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setUnreadOnly(true)}
            >
              {t("page.unreadOnly")}
            </Button>
          </Box>

          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              disabled={markAll.isPending}
              onClick={() => markAll.mutate()}
            >
              {t("page.markAll")}
            </Button>
          )}
        </Box>

        {isLoading ? (
          <Text className="py-10 text-center text-sm text-muted-foreground">{t("bell.loading")}</Text>
        ) : rows.length === 0 ? (
          <Box className="flex flex-col items-center gap-1 py-10">
            <Bell className="size-6 text-muted-foreground" />
            <Text className="text-sm font-medium text-foreground">{t("page.empty")}</Text>
            <Text className="text-xs text-muted-foreground">{t("page.emptyHint")}</Text>
          </Box>
        ) : (
          <Box className="flex flex-col">
            {rows.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
              />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}

function NotificationItem({ notification }: { notification: AdminNotification }) {
  const { t } = useTranslation("notifications");
  const markRead = useMarkNotificationRead();
  const Icon = ICONS[notification.type] ?? Bell;

  return (
    <Box
      className={cn(
        "flex items-start gap-3 border-b border-border/60 px-2 py-4 last:border-0",
        !notification.isRead && "bg-muted/40",
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

      <Box className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Text
          as="span"
          className="text-sm font-medium text-foreground"
        >
          {notification.title}
        </Text>
        <Text
          as="span"
          className="text-xs text-muted-foreground"
        >
          {notification.message}
        </Text>
        {notification.createdAt && (
          <Text
            as="span"
            className="text-[11px] text-muted-foreground"
          >
            {formatRelativeTime(notification.createdAt)}
          </Text>
        )}
      </Box>

      {!notification.isRead && (
        <Button
          variant="link"
          size="sm"
          className="h-auto shrink-0 p-0 text-xs"
          disabled={markRead.isPending}
          onClick={() => markRead.mutate(notification.id)}
        >
          {t("page.markRead")}
        </Button>
      )}
    </Box>
  );
}
