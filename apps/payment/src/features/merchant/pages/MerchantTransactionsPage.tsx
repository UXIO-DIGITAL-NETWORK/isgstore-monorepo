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
import type { UnifiedTransaction } from "@/types/transaction.type";

import { useMerchantTransactions } from "../hooks/useMerchant";

const money = (v: number) => formatCurrency(v, { fractionDigits: 0 });

const TABS = [
  { value: "all", label: "Semua" },
  { value: "sale", label: "Penjualan" },
  { value: "service", label: "Langganan Service" },
];

/**
 * Money in and money out share a table, so the direction is stated twice — once
 * as a type badge and once as a sign on the amount. The old "Nett" column meant
 * income only, and a purchase dropped into it unlabelled would read as one.
 */
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
  { key: "channel", header: "Metode", cell: (r) => r.payment_channel ?? "—" },
  {
    key: "amount",
    header: "Jumlah",
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
  { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
  { key: "created", header: "Tanggal", cell: (r) => formatDateTime(r.created_at) },
];

export default function MerchantTransactionsPage() {
  const [page, setPage] = useState(1);
  const [type, setType] = useState("all");
  const { data, isLoading, isError } = useMerchantTransactions({ page, per_page: 20, type });

  return (
    <Box className="flex flex-col gap-6">
      <Heading level={1}>Transaksi</Heading>

      <Tabs
        value={type}
        onValueChange={(next) => {
          setType(next);
          // A filter change re-scopes the list, so page 3 of the old filter is
          // meaningless against the new one.
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
