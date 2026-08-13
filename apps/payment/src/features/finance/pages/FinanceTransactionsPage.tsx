import { useState } from "react";
import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Pager } from "@/components/common/Pager";
import { SimpleTable, type Column } from "@/components/common/SimpleTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Text } from "@/components/common/Text";
import { formatCurrency } from "@/utils/currency";
import { formatDateTime } from "@/utils/date";
import { useFinanceTransactions } from "../hooks/useFinance";
import type { FinanceTransaction } from "../types/finance.type";

const money = (v: number) => formatCurrency(v, { fractionDigits: 0 });

const columns: Column<FinanceTransaction>[] = [
  { key: "invoice", header: "Invoice", cell: (r) => <Text as="span" className="font-medium">{r.invoice_number}</Text> },
  { key: "merchant", header: "Merchant", cell: (r) => r.merchant?.name ?? "-" },
  { key: "total", header: "Total", className: "text-right tabular-nums", cell: (r) => money(r.amount_total) },
  { key: "base", header: "Nett Merchant", className: "text-right tabular-nums", cell: (r) => money(r.amount_base) },
  { key: "admin_fee", header: "Biaya Admin", className: "text-right tabular-nums", cell: (r) => money(r.admin_fee) },
  { key: "gateway", header: "Fee Gateway", className: "text-right tabular-nums", cell: (r) => money(r.gateway_fee) },
  {
    key: "profit",
    header: "Profit Kita",
    className: "text-right tabular-nums",
    cell: (r) => <Text as="span" className="text-success">{money(r.platform_profit)}</Text>,
  },
  { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
  { key: "created", header: "Tanggal", cell: (r) => formatDateTime(r.created_at) },
];

export default function FinanceTransactionsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useFinanceTransactions({ page, per_page: 20 });

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
      <Pager page={data?.page ?? page} lastPage={data?.lastPage ?? 1} total={data?.total ?? 0} onPageChange={setPage} />
    </Box>
  );
}
