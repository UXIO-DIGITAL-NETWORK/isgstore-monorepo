import { useState } from "react";
import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Pager } from "@/components/common/Pager";
import { SimpleTable, type Column } from "@/components/common/SimpleTable";
import { Text } from "@/components/common/Text";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/currency";
import { formatDateTime } from "@/utils/date";
import { useMerchantMutations } from "../hooks/useMerchant";
import type { MerchantMutation } from "../types/merchant.type";

const columns: Column<MerchantMutation>[] = [
  { key: "created", header: "Tanggal", cell: (r) => formatDateTime(r.created_at) },
  { key: "type", header: "Tipe", cell: (r) => <Text as="span" className="uppercase">{r.type}</Text> },
  { key: "ref", header: "Referensi", cell: (r) => r.reference ?? "-" },
  {
    key: "amount",
    header: "Jumlah",
    className: "text-right tabular-nums",
    cell: (r) => (
      <Text as="span" className={cn(r.amount < 0 ? "text-destructive" : "text-success")}>
        {formatCurrency(r.amount, { fractionDigits: 0 })}
      </Text>
    ),
  },
  {
    key: "balance",
    header: "Saldo Akhir",
    className: "text-right tabular-nums",
    cell: (r) => formatCurrency(r.balance_after, { fractionDigits: 0 }),
  },
  { key: "desc", header: "Keterangan", cell: (r) => r.description ?? "-" },
];

export default function MerchantMutationsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useMerchantMutations({ page, per_page: 20 });

  return (
    <Box className="flex flex-col gap-6">
      <Heading level={1}>Mutasi</Heading>
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
