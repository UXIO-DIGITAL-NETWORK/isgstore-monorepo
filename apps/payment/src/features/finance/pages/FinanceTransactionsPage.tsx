import { useState } from "react";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Pager } from "@/components/common/Pager";
import { SimpleTable, type Column } from "@/components/common/SimpleTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Text } from "@/components/common/Text";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/currency";
import { formatDateTime } from "@/utils/date";
import type { FinanceUnifiedTransaction } from "@/types/transaction.type";

import { useFinanceTransactions } from "../hooks/useFinance";

const money = (v: number) => formatCurrency(v, { fractionDigits: 0 });

const TABS = [
  { value: "all", label: "Semua" },
  { value: "sale", label: "Penjualan" },
  { value: "service", label: "Langganan Service" },
];

/** A service bill has no channel and no gateway, so its fee cells read "—". */
const feeCell = (row: FinanceUnifiedTransaction, value: number) =>
  row.type === "service" ? (
    <Text
      as="span"
      className="text-muted-foreground"
    >
      —
    </Text>
  ) : (
    money(value)
  );

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
    key: "type",
    header: "Tipe",
    cell: (r) =>
      r.type === "sale" ? (
        <Badge variant="secondary">Penjualan</Badge>
      ) : (
        <Badge variant="outline">Langganan</Badge>
      ),
  },
  {
    key: "amount",
    // Direction is client-relative on this screen too, matching what the old
    // "Nett Merchant" column has always meant.
    header: "Jumlah Client",
    className: "text-right tabular-nums",
    cell: (r) => (
      <Text
        as="span"
        className={cn("tabular-nums", r.direction === "in" ? "text-success" : "text-destructive")}
      >
        {r.direction === "in" ? "+" : "−"}
        {money(r.amount)}
      </Text>
    ),
  },
  { key: "total", header: "Total", className: "text-right tabular-nums", cell: (r) => money(r.amount_total) },
  {
    key: "admin_fee",
    header: "Biaya Admin",
    className: "text-right tabular-nums",
    cell: (r) => feeCell(r, r.admin_fee),
  },
  {
    key: "gateway",
    header: "Fee Gateway",
    className: "text-right tabular-nums",
    cell: (r) => feeCell(r, r.gateway_fee),
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
  const [type, setType] = useState("all");
  const { data, isLoading, isError } = useFinanceTransactions({ page, per_page: 20, type });

  return (
    <Box className="flex flex-col gap-6">
      <Heading level={1}>Transaksi</Heading>

      <Tabs
        value={type}
        onValueChange={(next) => {
          setType(next);
          setPage(1);
        }}
      >
        <TabsList>
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <SimpleTable
        columns={columns}
        rows={data?.rows ?? []}
        isLoading={isLoading}
        isError={isError}
        // Ids repeat across the two sources; the pair is what is unique.
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
