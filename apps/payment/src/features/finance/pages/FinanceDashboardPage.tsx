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
import type { FinanceTransaction } from "../types/finance.type";

const money = (v: number) => formatCurrency(v, { fractionDigits: 0 });

const recentColumns: Column<FinanceTransaction>[] = [
  { key: "invoice", header: "Invoice", cell: (r) => <Text as="span" className="font-medium">{r.invoice_number}</Text> },
  { key: "merchant", header: "Merchant", cell: (r) => r.merchant?.name ?? "-" },
  { key: "total", header: "Total", className: "text-right tabular-nums", cell: (r) => money(r.amount_total) },
  {
    key: "profit",
    header: "Profit Kita",
    className: "text-right tabular-nums",
    cell: (r) => <Text as="span" className="text-success">{money(r.platform_profit)}</Text>,
  },
  { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
  { key: "created", header: "Tanggal", cell: (r) => formatDateTime(r.created_at) },
];

export default function FinanceDashboardPage() {
  const { data } = useFinanceDashboard();
  const { data: recent, isLoading, isError } = useFinanceTransactions({ page: 1, per_page: 5 });

  return (
    <Box className="flex flex-col gap-6">
      <Heading level={1}>Dashboard</Heading>

      <Box className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          data={{ id: "saldo", label: "Saldo (Profit)", value: data?.saldo ?? 0, caption: "Akumulasi markup admin fee" }}
        />
        <StatCard
          data={{ id: "markup", label: "Total Markup", value: data?.total_markup ?? 0, caption: "Admin fee dari seluruh transaksi" }}
        />
        <StatCard
          data={{ id: "gateway", label: "Total Fee Gateway", value: data?.total_gateway_fee ?? 0, caption: "Fee Monetapay" }}
        />
        <StatCard
          data={{ id: "settled", label: "Disetorkan ke Merchant", value: data?.total_settled_to_merchants ?? 0, caption: "Penjualan bersih merchant" }}
        />
        <StatCard
          data={{ id: "pending", label: "Penarikan Pending", value: data?.pending_withdrawals ?? 0, format: "count", caption: "Menunggu persetujuan" }}
        />
        <StatCard
          data={{ id: "pending-amt", label: "Nominal Pending", value: data?.pending_withdrawals_amount ?? 0, caption: "Total nominal menunggu" }}
        />
      </Box>

      <Box className="flex flex-col gap-3">
        <Box className="flex items-center justify-between">
          <Heading level={2}>Transaksi Terbaru</Heading>
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
          emptyLabel="Belum ada transaksi"
          rowKey={(r) => r.id}
        />
      </Box>
    </Box>
  );
}
