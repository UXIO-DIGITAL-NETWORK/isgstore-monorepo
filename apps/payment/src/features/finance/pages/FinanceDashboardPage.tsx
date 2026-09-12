import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Link } from "@/components/common/Link";
import { SimpleTable, type Column } from "@/components/common/SimpleTable";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Text } from "@/components/common/Text";
import { formatCurrency } from "@/utils/currency";
import { formatDateTime } from "@/utils/date";
import { useFinanceDashboard, useFinanceTransactions } from "../hooks/useFinance";
import type { FinanceUnifiedTransaction } from "@/types/transaction.type";

const money = (v: number) => formatCurrency(v, { fractionDigits: 0 });

/**
 * A factory rather than a module constant: column headers are rendered text, so
 * they have to resolve when the component renders.
 */
const recentColumnsFor = (t: TFunction<"finance">): Column<FinanceUnifiedTransaction>[] => [
  { key: "invoice", header: t("dashboard.colInvoice"), cell: (r) => <Text as="span" className="font-medium">{r.invoice_number}</Text> },
  { key: "merchant", header: t("dashboard.colMerchant"), cell: (r) => r.merchant?.name ?? "-" },
  { key: "title", header: t("dashboard.colItem"), cell: (r) => r.title ?? "-" },
  { key: "total", header: t("dashboard.colTotal"), className: "text-right tabular-nums", cell: (r) => money(r.amount_total) },
  {
    key: "profit",
    header: t("dashboard.colProfit"),
    className: "text-right tabular-nums",
    cell: (r) => <Text as="span" className="text-success">{money(r.platform_profit)}</Text>,
  },
  { key: "status", header: t("dashboard.colStatus"), cell: (r) => <StatusBadge status={r.status} /> },
  { key: "created", header: t("dashboard.colDate"), cell: (r) => formatDateTime(r.created_at) },
];

export default function FinanceDashboardPage() {
  const { t } = useTranslation("finance");
  const recentColumns = recentColumnsFor(t);
  const { data } = useFinanceDashboard();
  const { data: recent, isLoading, isError } = useFinanceTransactions({ page: 1, per_page: 5 });

  return (
    <Box className="flex flex-col gap-6">
      <Heading level={1}>{t("dashboard.title")}</Heading>

      <Box className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          data={{ id: "saldo", label: t("dashboard.balance"), value: data?.saldo ?? 0, caption: t("dashboard.balanceCaption") }}
        />
        <StatCard
          data={{ id: "admin-fee", label: t("dashboard.totalAdminFee"), value: data?.total_admin_fee ?? 0, caption: t("dashboard.totalAdminFeeCaption") }}
        />
        <StatCard
          data={{ id: "gateway", label: t("dashboard.totalGatewayFee"), value: data?.total_gateway_fee ?? 0, caption: t("dashboard.totalGatewayFeeCaption") }}
        />
        <StatCard
          data={{ id: "tax", label: t("dashboard.totalTax"), value: data?.total_tax ?? 0, caption: t("dashboard.totalTaxCaption") }}
        />
        <StatCard
          data={{ id: "settled", label: t("dashboard.settled"), value: data?.total_settled_to_merchants ?? 0, caption: t("dashboard.settledCaption") }}
        />
        <StatCard
          data={{ id: "tx-count", label: t("dashboard.txCount"), value: data?.total_transactions_count ?? 0, format: "count", caption: t("dashboard.txCountCaption") }}
        />
        <StatCard
          data={{ id: "tx-amount", label: t("dashboard.txAmount"), value: data?.total_transactions_amount ?? 0, caption: t("dashboard.txAmountCaption") }}
        />
        <StatCard
          data={{ id: "pending", label: t("dashboard.pendingWithdrawals"), value: data?.pending_withdrawals ?? 0, format: "count", caption: t("dashboard.pendingWithdrawalsCaption") }}
        />
        <StatCard
          data={{ id: "pending-amt", label: t("dashboard.pendingAmount"), value: data?.pending_withdrawals_amount ?? 0, caption: t("dashboard.pendingAmountCaption") }}
        />
      </Box>

      <Box className="flex flex-col gap-3">
        <Box className="flex items-center justify-between">
          <Heading level={2}>{t("dashboard.latestTransactions")}</Heading>
          <Link href="/app/payment-internal/transactions">
            <Text as="span" variant="small" className="underline">
              Lihat semua
            </Text>
          </Link>
        </Box>
        <SimpleTable
          columns={recentColumns}
          rows={recent?.rows ?? []}
          isLoading={isLoading}
          isError={isError}
          emptyLabel={t("dashboard.empty")}
          rowKey={(r) => `${r.type}-${r.id}`}
        />
      </Box>
    </Box>
  );
}
