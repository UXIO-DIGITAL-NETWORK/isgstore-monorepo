import { useTranslation } from "react-i18next";
import { ArrowDownToLine, Bell, CalendarClock, Receipt, ShoppingBag } from "lucide-react";
import type { ComponentType } from "react";

import { Box } from "@/components/common/Box";
import { Link } from "@/components/common/Link";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { isPaymentAdmin } from "@/constants/roles";
import { notificationTarget, type NotificationAudience } from "@/lib/notificationTarget";
import { useAuthStore } from "@/store/useAuthStore";
import { formatRelativeTime } from "@/utils/date";

import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationUnreadCount,
  useNotifications,
} from "../hooks/useFinance";
import type { FinanceNotification } from "../types/finance.type";

/** Per-type glyph so the feed is scannable at a glance; unknown types fall back to the bell. */
const ICONS: Record<string, ComponentType<{ className?: string }>> = {
  transaction_sale: ShoppingBag,
  service_payment: Receipt,
  withdrawal_request: ArrowDownToLine,
  subscription_expiring: CalendarClock,
};

/** Each role reads its feed on its own route; the API scopes the rows either way. */
const notificationsHref = (isClient: boolean) =>
  isClient ? "/app/payment-admin/notifications" : "/app/payment-internal/notifications";

/**
 * Navbar bell: an unread badge fed by a live count, and a dropdown of the most
 * recent notifications with a "mark all read" action and a link to the full page.
 * Rendered for both roles, so every destination it offers is role-aware.
 *
 * Rows that have somewhere to go are menu items wrapping a link, which is what
 * makes the menu close on the way out; a type with no destination stays a plain
 * row rather than a link that leads nowhere.
 */
export function NotificationBell() {
  const { t } = useTranslation("finance");
  const isClient = isPaymentAdmin(useAuthStore((state) => state.user));
  const audience: NotificationAudience = isClient ? "client" : "internal";
  const { data: unreadCount = 0 } = useNotificationUnreadCount();
  // Only the first page — the dropdown is a preview; the page is the full list.
  const { data, isLoading } = useNotifications({ per_page: 6 });
  const markAll = useMarkAllNotificationsRead();
  const markRead = useMarkNotificationRead();

  const rows = data?.rows ?? [];
  const hasUnread = unreadCount > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={hasUnread ? t("notificationBell.labelUnread", { count: unreadCount }) : t("notificationBell.label")}
        >
          <Bell className="size-5" />
          {hasUnread && (
            <Box
              as="span"
              aria-hidden
              className="absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] leading-none font-semibold text-white tabular-nums"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Box>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 p-0"
      >
        <Box className="flex items-center justify-between border-b border-border px-4 py-3">
          <Text
            as="span"
            className="text-sm font-medium text-foreground"
          >
            {t("notificationBell.title")}
          </Text>
          {hasUnread && (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              disabled={markAll.isPending}
              onClick={() => markAll.mutate()}
            >
              {t("notificationBell.markAll")}
            </Button>
          )}
        </Box>

        <ScrollArea className="max-h-80">
          {isLoading ? (
            <Text className="px-4 py-6 text-center text-sm text-muted-foreground">{t("notificationBell.loading")}</Text>
          ) : rows.length === 0 ? (
            <Text className="px-4 py-6 text-center text-sm text-muted-foreground">{t("notificationBell.empty")}</Text>
          ) : (
            rows.map((notification) => (
              <NotificationRow
                key={notification.id}
                notification={notification}
                audience={audience}
                // Opening a notification is also the moment it stops being
                // unread — the count would otherwise keep nagging about
                // something the reader has just dealt with.
                onOpen={() => {
                  if (!notification.is_read) markRead.mutate(notification.id);
                }}
              />
            ))
          )}
        </ScrollArea>

        <Box className="border-t border-border p-2">
          <Link
            href={notificationsHref(isClient)}
            className="block rounded-md px-2 py-1.5 text-center text-sm text-muted-foreground hover:text-foreground"
          >
            {t("notificationBell.viewAll")}
          </Link>
        </Box>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationRow({
  notification,
  audience,
  onOpen,
}: {
  notification: FinanceNotification;
  audience: NotificationAudience;
  onOpen: () => void;
}) {
  const Icon = ICONS[notification.type] ?? Bell;
  const target = notificationTarget(notification.type, audience);

  const body = (
    <>
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <Box className="flex min-w-0 flex-col gap-0.5">
        <Text
          as="span"
          className="truncate text-sm font-medium text-foreground"
        >
          {notification.title}
        </Text>
        <Text
          as="span"
          className="line-clamp-2 text-xs text-muted-foreground"
        >
          {notification.message}
        </Text>
        {notification.created_at && (
          <Text
            as="span"
            className="text-[11px] text-muted-foreground"
          >
            {formatRelativeTime(notification.created_at)}
          </Text>
        )}
      </Box>
    </>
  );

  const rowClass = cn(
    "flex gap-3 border-b border-border/60 px-4 py-3 last:border-0",
    !notification.is_read && "bg-muted/50",
  );

  if (!target) {
    return <Box className={rowClass}>{body}</Box>;
  }

  return (
    <DropdownMenuItem asChild>
      <Link
        href={target}
        onClick={onOpen}
        className={cn(rowClass, "cursor-pointer items-start rounded-none focus:bg-muted/70")}
      >
        {body}
      </Link>
    </DropdownMenuItem>
  );
}
