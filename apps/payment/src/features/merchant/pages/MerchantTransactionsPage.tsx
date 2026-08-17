import { useState } from "react";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Pager } from "@/components/common/Pager";
import { SimpleTable, type Column } from "@/components/common/SimpleTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Text } from "@/components/common/Text";
import { formatCurrency } from "@/utils/currency";
import { formatDateTime } from "@/utils/date";
import type { UnifiedTransaction } from "@/types/transaction.type";

import { useMerchantTransactions } from "../hooks/useMerchant";

const money = (v: number) => formatCurrency(v, { fractionDigits: 0 });

// Both topup sales (money in) and the service bills kita issues the client
// (money out). Direction drives the sign/colour; a service bill has no payment
// channel, so "Metode" falls back to a dash.
const columns: Column<UnifiedTransaction>[] = [
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
  { key: "title", header: "Item", cell: (r) => r.title ?? "-" },
  { key: "channel", header: "Metode", cell: (r) => r.payment_channel ?? "—" },
  {
    key: "amount",
    header: "Jumlah",
    className: "text-right tabular-nums",
    cell: (r) => (
      <Text
        as="span"
        className={`tabular-nums ${r.direction === "out" ? "text-destructive" : "text-success"}`}
      >
        {r.direction === "out" ? "−" : "+"}
        {money(r.amount)}
      </Text>
    ),
  },
  { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
  { key: "created", header: "Tanggal", cell: (r) => formatDateTime(r.created_at) },
];

export default function MerchantTransactionsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useMerchantTransactions({ page, per_page: 20, type: "all" });

  return (
    <Box className="flex flex-col gap-6">
      <Heading level={1}>Transaksi</Heading>

      <SimpleTable
        columns={columns}
        rows={data?.rows ?? []}
        isLoading={isLoading}
        isError={isError}
        rowKey={(r) => `${r.type}-${r.id}`}
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
