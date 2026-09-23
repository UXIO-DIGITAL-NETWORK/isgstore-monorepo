import { useTranslation } from "react-i18next";
import { useState } from "react";
import { ArrowDownToLine, Bell, CalendarClock, Receipt, ShoppingBag } from "lucide-react";
import type { ComponentType } from "react";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Link } from "@/components/common/Link";
import { Pager } from "@/components/common/Pager";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { isPaymentAdmin } from "@/constants/roles";
import { notificationTarget, type NotificationAudience } from "@/lib/notificationTarget";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { formatDateTime } from "@/utils/date";

import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "../hooks/useFinance";
import type { FinanceNotification } from "../types/finance.type";

const ICONS: Record<string, ComponentType<{ className?: string }>> = {
  transaction_sale: ShoppingBag,
  service_payment: Receipt,
  withdrawal_request: ArrowDownToLine,
  subscription_expiring: CalendarClock,
};

type Filter = "all" | "unread";

/**
 * The full notification feed, for both roles. Newest first, unread emphasised.
 *
 * A row that has somewhere to go is a link to it: a notification about a bill
 * you cannot open from the notification is an announcement, not a notification.
 * The destination is per type and per audience — see lib/notificationTarget,
 * because the two roles' pages are not the same pages.
 *
 * Marking read is a visible control rather than the whole card, so the click
 * that navigates and the click that changes state are never the same gesture.
 */
export default function NotificationsPage() {
  const { t } = useTranslation("finance");
  const isClient = isPaymentAdmin(useAuthStore((state) => state.user));
  const audience: NotificationAudience = isClient ? "client" : "internal";
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<Filter>("all");
  const { data, isLoading, isError } = useNotifications({
    page,
    per_page: 20,
    ...(filter === "unread" ? { filter: "unread" } : {}),
  });
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const rows = data?.rows ?? [];

  const setFilterAndReset = (next: Filter) => {
    setFilter(next);
    setPage(1);
  };

  return (
    <Box className="flex flex-col gap-6">
      <Box className="flex flex-wrap items-center justify-between gap-3">
        <Heading level={1}>{t("notifications.title")}</Heading>
        <Button
          variant="outline"
          size="sm"
          disabled={markAll.isPending}
          onClick={() => markAll.mutate()}
        >
          {t("notifications.markAll")}
        </Button>
      </Box>

      <Box className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterAndReset("all")}
        >
          {t("notifications.filterAll")}
        </Button>
        <Button
          variant={filter === "unread" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterAndReset("unread")}
        >
          {t("notifications.filterUnread")}
        </Button>
      </Box>

      {isError ? (
        <Text className="text-sm text-destructive">{t("notifications.loadFailed")}</Text>
      ) : isLoading ? (
        <Text className="text-sm text-muted-foreground">{t("notifications.loading")}</Text>
      ) : rows.length === 0 ? (
        <Empty className="border border-dashed border-border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Bell />
            </EmptyMedia>
            <EmptyTitle>{t("notifications.empty")}</EmptyTitle>
            <EmptyDescription>{t("notifications.emptyDescription")}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Box className="flex flex-col gap-2">
          {rows.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              audience={audience}
              onMarkRead={() => {
                if (!notification.is_read) markRead.mutate(notification.id);
              }}
            />
          ))}
        </Box>
      )}

      <Pager
        page={data?.page ?? page}
        lastPage={data?.lastPage ?? 1}
        total={data?.total ?? 0}
        onPageChange={setPage}
      />
    </Box>
  );
}

function NotificationCard({
  notification,
  audience,
  onMarkRead,
}: {
  notification: FinanceNotification;
  audience: NotificationAudience;
  onMarkRead: () => void;
}) {
  const { t } = useTranslation("finance");
  const Icon = ICONS[notification.type] ?? Bell;
  const target = notificationTarget(notification.type, audience);

  const body = (
    <>
      <Box className="flex items-center gap-2">
        <Text
          as="span"
          className="truncate text-sm font-medium text-foreground"
        >
          {notification.title}
        </Text>
        {!notification.is_read && (
          <Box
            as="span"
            aria-label={t("notifications.unread")}
            className="size-2 shrink-0 rounded-full bg-destructive"
          />
        )}
      </Box>
      <Text
        as="span"
        className="text-sm text-muted-foreground"
      >
        {notification.message}
      </Text>
      <Text
        as="span"
        className="text-xs text-muted-foreground tabular-nums"
      >
        {formatDateTime(notification.created_at)}
      </Text>
    </>
  );

  const bodyClass = "flex min-w-0 flex-1 flex-col gap-0.5";

  return (
    <Box
      className={cn(
        "flex w-full items-start gap-4 rounded-lg border border-border px-4 py-3",
        !notification.is_read && "bg-muted/40",
      )}
    >
      <Box className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
        <Icon className="size-4 text-muted-foreground" />
      </Box>

      {target ? (
        <Link
          href={target}
          onClick={onMarkRead}
          className={cn(
            bodyClass,
            "rounded-md outline-none hover:underline focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          )}
        >
          {body}
        </Link>
      ) : (
        <Box className={bodyClass}>{body}</Box>
      )}

      {!notification.is_read && (
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0"
          onClick={onMarkRead}
        >
          {t("notifications.markRead")}
        </Button>
      )}
    </Box>
  );
}
