import { useState } from "react";
import { ArrowDownToLine, Bell, CalendarClock, Receipt, ShoppingBag } from "lucide-react";
import type { ComponentType } from "react";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Pager } from "@/components/common/Pager";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/utils/date";

import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from "../hooks/useFinance";
import type { FinanceNotification } from "../types/finance.type";

const ICONS: Record<string, ComponentType<{ className?: string }>> = {
  transaction_sale: ShoppingBag,
  service_payment: Receipt,
  withdrawal_request: ArrowDownToLine,
  subscription_expiring: CalendarClock,
};

type Filter = "all" | "unread";

/**
 * The internal team's full notification feed. Newest first, unread emphasised;
 * clicking an unread row marks it read, and "Tandai semua dibaca" clears the
 * badge in one call. The filter mirrors the API's `?filter=unread`.
 */
export default function NotificationsPage() {
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
        <Heading level={1}>Notifikasi</Heading>
        <Button
          variant="outline"
          size="sm"
          disabled={markAll.isPending}
          onClick={() => markAll.mutate()}
        >
          Tandai semua dibaca
        </Button>
      </Box>

      <Box className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterAndReset("all")}
        >
          Semua
        </Button>
        <Button
          variant={filter === "unread" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterAndReset("unread")}
        >
          Belum dibaca
        </Button>
      </Box>

      {isError ? (
        <Text className="text-sm text-destructive">Gagal memuat notifikasi.</Text>
      ) : isLoading ? (
        <Text className="text-sm text-muted-foreground">Memuat…</Text>
      ) : rows.length === 0 ? (
        <Empty className="border border-dashed border-border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Bell />
            </EmptyMedia>
            <EmptyTitle>Belum ada notifikasi</EmptyTitle>
            <EmptyDescription>
              Notifikasi transaksi client, pembayaran layanan, permintaan penarikan, dan paket yang akan berakhir akan
              muncul di sini.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Box className="flex flex-col gap-2">
          {rows.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
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
  onMarkRead,
}: {
  notification: FinanceNotification;
  onMarkRead: () => void;
}) {
  const Icon = ICONS[notification.type] ?? Bell;

  return (
    <Box
      as="button"
      type="button"
      onClick={onMarkRead}
      className={cn(
        "flex w-full gap-4 rounded-lg border border-border px-4 py-3 text-left transition-colors hover:bg-muted/50",
        !notification.is_read && "bg-muted/40",
      )}
    >
      <Box className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
        <Icon className="size-4 text-muted-foreground" />
      </Box>
      <Box className="flex min-w-0 flex-1 flex-col gap-0.5">
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
              aria-label="Belum dibaca"
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
      </Box>
    </Box>
  );
}
