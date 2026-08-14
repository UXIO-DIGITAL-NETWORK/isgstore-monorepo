import { useState } from "react";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Pager } from "@/components/common/Pager";
import { SimpleTable, type Column } from "@/components/common/SimpleTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Text } from "@/components/common/Text";
import { formatCurrency } from "@/utils/currency";
import { formatDateTime } from "@/utils/date";
import type { FinanceUnifiedTransaction } from "@/types/transaction.type";

import { useFinanceTransactions } from "../hooks/useFinance";

const money = (v: number) => formatCurrency(v, { fractionDigits: 0 });

// This screen is topup-only ("Penjualan"): service subscription invoices live
// on the dedicated Invoice / Subscription pages, so the feed is locked to sales.
const columns: Column<FinanceUnifiedTransaction>[] = [
  {
    key: "invoice",
    header: "Invoice",
    cell: (r) => (
      <Text
        as="span"
        className="font-medium"
      >
        {r.invoice_number}
      </Text>
    ),
  },
  { key: "merchant", header: "Client", cell: (r) => r.merchant?.name ?? "-" },
  { key: "title", header: "Item", cell: (r) => r.title ?? "-" },
  {
    key: "amount",
    header: "Jumlah Client",
    className: "text-right tabular-nums",
    cell: (r) => (
      <Text
        as="span"
        className="text-success tabular-nums"
      >
        +{money(r.amount)}
      </Text>
    ),
  },
  { key: "total", header: "Total", className: "text-right tabular-nums", cell: (r) => money(r.amount_total) },
  {
    key: "admin_fee",
    header: "Biaya Admin",
    className: "text-right tabular-nums",
    cell: (r) => money(r.admin_fee),
  },
  {
    key: "gateway",
    header: "Fee Gateway",
    className: "text-right tabular-nums",
    cell: (r) => money(r.gateway_fee),
  },
  {
    key: "profit",
    header: "Profit Kita",
    className: "text-right tabular-nums",
    cell: (r) => (
      <Text
        as="span"
        className="text-success tabular-nums"
      >
        {money(r.platform_profit)}
      </Text>
    ),
  },
  { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
  { key: "created", header: "Tanggal", cell: (r) => formatDateTime(r.created_at) },
];

export default function FinanceTransactionsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useFinanceTransactions({ page, per_page: 20, type: "sale" });

  return (
    <Box className="flex flex-col gap-6">
      <Heading level={1}>Transaksi</Heading>

      <SimpleTable
        columns={columns}
        rows={data?.rows ?? []}
        isLoading={isLoading}
        isError={isError}
        rowKey={(r) => r.id}
      />

      <Pager
        page={data?.page ?? page}
        lastPage={data?.lastPage ?? 1}
        total={data?.total ?? 0}
        onPageChange={setPage}
      />
    </Box>
  );
}
