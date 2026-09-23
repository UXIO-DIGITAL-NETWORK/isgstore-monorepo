import { useTranslation } from "react-i18next";
import { RefreshCw } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Link } from "@/components/common/Link";
import { StatCard, type StatCardData } from "@/components/common/StatCard";
import { Text } from "@/components/common/Text";
import { PaymentStatusBadge } from "@/components/common/TransactionStatusBadges";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { resolvePaymentStatus } from "@/lib/transactionStatus";
import type { UnifiedTransaction } from "@/types/transaction.type";
import { formatCurrency } from "@/utils/currency";
import { formatDateTime, formatWib, PLATFORM_TIMEZONE_LABEL } from "@/utils/date";

import { WebsiteServicesCard } from "../components/WebsiteServicesCard";
import { useMerchantDashboard, useMerchantTransactions } from "../hooks/useMerchant";

const money = (v: number) => formatCurrency(v, { fractionDigits: 0 });

/** How many rows of the feed a dashboard is allowed to carry. */
const RECENT_LIMIT = 5;

/**
 * The client's landing screen, composed as a monitoring surface: the balances
 * they are owed, what is still in flight, and what happened recently.
 *
 * Two rules the layout follows:
 *
 *  - **Every figure has a way through.** A number a client cannot act on or
 *    explain is a dead end, so each card links to the screen that accounts for
 *    it — "Saldo Tertahan" is useless without the sales holding it.
 *  - **A failed read never renders as a zero.** Showing "Rp 0" while the request
 *    is in flight or broken is indistinguishable from a genuinely empty
 *    account, on the one screen where that mistake costs trust. Loading gets
 *    skeletons, failure gets an alert and a retry.
 */
export default function MerchantDashboardPage() {
  const { t } = useTranslation("merchant");
  const { data, isLoading, isError, refetch, dataUpdatedAt } = useMerchantDashboard();
  const recent = useMerchantTransactions({ page: 1, per_page: RECENT_LIMIT });

  const cards: StatCardData[] = [
    {
      id: "saldo",
      label: t("dashboard.balanceActive"),
      value: data?.saldo_aktif ?? 0,
      caption: t("dashboard.balanceActiveCaption"),
      href: "/app/payment-admin/withdrawals",
    },
    {
      id: "pending",
      label: t("dashboard.balancePending"),
      value: data?.saldo_pending ?? 0,
      caption: t("dashboard.balancePendingCaption"),
      href: "/app/payment-admin/withdrawals",
    },
    // Earned but still inside the per-channel holding period — without this
    // card a freshly-paid sale reads as "missing money", and without the link
    // there is no way to find out which sales those are.
    {
      id: "tertahan",
      label: t("dashboard.balanceHeld"),
      value: data?.saldo_tertahan ?? 0,
      caption: t("dashboard.balanceHeldCaption"),
      href: "/app/payment-admin/transactions",
    },
    {
      id: "penjualan",
      label: t("dashboard.totalSales"),
      value: data?.total_penjualan ?? 0,
      caption: t("dashboard.totalSalesCaption"),
      href: "/app/payment-admin/transactions",
    },
    {
      id: "penarikan",
      label: t("dashboard.totalWithdrawals"),
      value: data?.total_penarikan ?? 0,
      caption: t("dashboard.totalWithdrawalsCaption"),
      href: "/app/payment-admin/withdrawals",
    },
    {
      id: "transaksi",
      label: t("dashboard.totalTransactions"),
      value: data?.total_transaksi ?? 0,
      format: "count",
      caption: t("dashboard.totalTransactionsCaption"),
      href: "/app/payment-admin/transactions",
    },
  ];

  const rows = recent.data?.rows ?? [];

  return (
    <Box className="flex flex-col gap-6">
      <Box className="flex flex-wrap items-center justify-between gap-3">
        <Heading level={1}>{t("dashboard.title")}</Heading>

        <Box className="flex items-center gap-3">
          {dataUpdatedAt ? (
            <Text
              as="span"
              variant="small"
            >
              {t("dashboard.updatedAt", {
                time: `${formatWib(new Date(dataUpdatedAt), "HH:mm")} ${PLATFORM_TIMEZONE_LABEL}`,
              })}
            </Text>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            // A monitoring screen with a silent refresh leaves the operator
            // guessing whether what they are reading is current.
            disabled={isLoading}
            onClick={() => refetch?.()}
          >
            <RefreshCw aria-hidden="true" />
            {t("dashboard.refresh")}
          </Button>
        </Box>
      </Box>

      {isError ? (
        <Alert variant="destructive">
          <AlertTitle>{t("dashboard.loadFailedTitle")}</AlertTitle>
          <AlertDescription>
            <Box className="flex flex-col items-start gap-3">
              {/* Says what the screen is doing about it, not just that it
                  broke: the figures are withheld rather than shown wrong. */}
              <Text
                as="span"
                variant="small"
              >
                {t("dashboard.loadFailed")}
              </Text>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch?.()}
              >
                {t("dashboard.retry")}
              </Button>
            </Box>
          </AlertDescription>
        </Alert>
      ) : null}

      {isLoading ? (
        <Box className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Skeleton
              key={card.id}
              className="h-[7.5rem] rounded-xl"
            />
          ))}
        </Box>
      ) : isError ? null : (
        <Box className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <StatCard
              key={card.id}
              data={card}
            />
          ))}
        </Box>
      )}

      <WebsiteServicesCard
        activeUntil={data?.service_active_until ?? null}
        activeServicesCount={data?.active_services_count ?? 0}
      />

      <Box className="flex flex-col gap-3">
        <Box className="flex flex-wrap items-center justify-between gap-2">
          <Heading level={2}>{t("dashboard.recentTitle")}</Heading>
          <Link
            href="/app/payment-admin/transactions"
            className="text-sm text-primary underline underline-offset-4"
          >
            {t("dashboard.viewAll")}
          </Link>
        </Box>

        {recent.isLoading ? (
          <Box className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <Skeleton
                key={i}
                className="h-16 rounded-xl"
              />
            ))}
          </Box>
        ) : recent.isError ? (
          <Box className="flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4">
            <Text
              as="span"
              variant="small"
              className="text-destructive"
            >
              {t("dashboard.recentFailed")}
            </Text>
            <Button
              variant="outline"
              size="sm"
              onClick={() => recent.refetch()}
            >
              {t("dashboard.retry")}
            </Button>
          </Box>
        ) : rows.length === 0 ? (
          // The first thing a brand-new client sees. It names the space and
          // gives the one useful next step rather than a bare "no data".
          <Empty className="rounded-xl border border-dashed border-border bg-card">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <RefreshCw aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>{t("dashboard.recentEmptyTitle")}</EmptyTitle>
              <EmptyDescription>{t("dashboard.recentEmpty")}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Link href="/app/payment-admin/services">
                <Button>{t("dashboard.recentEmptyCta")}</Button>
              </Link>
            </EmptyContent>
          </Empty>
        ) : (
          <Box className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {rows.map((row: UnifiedTransaction) => (
              <Box
                key={`${row.type}-${row.id}`}
                className="flex items-center justify-between gap-4 p-4"
              >
                <Box className="flex min-w-0 flex-col gap-1">
                  <Text
                    as="span"
                    className="truncate font-medium"
                  >
                    {row.title ?? row.invoice_number}
                  </Text>
                  <Text
                    as="span"
                    variant="small"
                  >
                    {row.invoice_number} · {formatDateTime(row.created_at)}
                  </Text>
                </Box>
                <Box className="flex shrink-0 items-center gap-3">
                  <PaymentStatusBadge status={resolvePaymentStatus(row)} />
                  <Text
                    as="span"
                    className={`tabular-nums ${row.direction === "out" ? "text-destructive" : "text-success"}`}
                  >
                    {row.direction === "out" ? "−" : "+"}
                    {money(row.amount)}
                  </Text>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
