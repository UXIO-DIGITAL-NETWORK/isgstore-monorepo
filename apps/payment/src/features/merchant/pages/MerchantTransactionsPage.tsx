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

// Topup sales only. Service subscription bills have their own Invoice /
// Langganan pages, so they never appear in this transaction feed.
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
        className="text-success tabular-nums"
      >
        +{money(r.amount)}
      </Text>
    ),
  },
  { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
  { key: "created", header: "Tanggal", cell: (r) => formatDateTime(r.created_at) },
];

export default function MerchantTransactionsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useMerchantTransactions({ page, per_page: 20, type: "sale" });

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
