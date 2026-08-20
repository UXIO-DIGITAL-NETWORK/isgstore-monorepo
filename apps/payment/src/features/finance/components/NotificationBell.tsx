import { ArrowDownToLine, Bell, CalendarClock, Receipt, ShoppingBag } from "lucide-react";
import type { ComponentType } from "react";

import { Box } from "@/components/common/Box";
import { Link } from "@/components/common/Link";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/utils/date";

import { useMarkAllNotificationsRead, useNotificationUnreadCount, useNotifications } from "../hooks/useFinance";
import type { FinanceNotification } from "../types/finance.type";

/** Per-type glyph so the feed is scannable at a glance; unknown types fall back to the bell. */
const ICONS: Record<string, ComponentType<{ className?: string }>> = {
  transaction_sale: ShoppingBag,
  service_payment: Receipt,
  withdrawal_request: ArrowDownToLine,
  subscription_expiring: CalendarClock,
};

const NOTIFICATIONS_HREF = "/app/payment-internal/notifications";

/**
 * Navbar bell for the internal team: an unread badge fed by a polling count,
 * and a dropdown of the most recent notifications with a "mark all read" action
 * and a link to the full page. Gated by <Can> at the call site — this component
 * assumes the caller is payment-internal.
 */
export function NotificationBell() {
  const { data: unreadCount = 0 } = useNotificationUnreadCount();
  // Only the first page — the dropdown is a preview; the page is the full list.
  const { data, isLoading } = useNotifications({ per_page: 6 });
  const markAll = useMarkAllNotificationsRead();

  const rows = data?.rows ?? [];
  const hasUnread = unreadCount > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={hasUnread ? `Notifikasi, ${unreadCount} belum dibaca` : "Notifikasi"}
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
            Notifikasi
          </Text>
          {hasUnread && (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              disabled={markAll.isPending}
              onClick={() => markAll.mutate()}
            >
              Tandai semua dibaca
            </Button>
          )}
        </Box>

        <ScrollArea className="max-h-80">
          {isLoading ? (
            <Text className="px-4 py-6 text-center text-sm text-muted-foreground">Memuat…</Text>
          ) : rows.length === 0 ? (
            <Text className="px-4 py-6 text-center text-sm text-muted-foreground">Belum ada notifikasi</Text>
          ) : (
            rows.map((notification) => (
              <NotificationRow
                key={notification.id}
                notification={notification}
              />
            ))
          )}
        </ScrollArea>

        <Box className="border-t border-border p-2">
          <Link
            href={NOTIFICATIONS_HREF}
            className="block rounded-md px-2 py-1.5 text-center text-sm text-muted-foreground hover:text-foreground"
          >
            Lihat semua
          </Link>
        </Box>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationRow({ notification }: { notification: FinanceNotification }) {
  const Icon = ICONS[notification.type] ?? Bell;

  return (
    <Box
      className={cn(
        "flex gap-3 border-b border-border/60 px-4 py-3 last:border-0",
        !notification.is_read && "bg-muted/50",
      )}
    >
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
    </Box>
  );
}
