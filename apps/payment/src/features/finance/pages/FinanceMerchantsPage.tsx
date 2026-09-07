import { useState } from "react";
import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Pager } from "@/components/common/Pager";
import { SimpleTable, type Column } from "@/components/common/SimpleTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Text } from "@/components/common/Text";
import { formatCurrency } from "@/utils/currency";
import { formatDateTime } from "@/utils/date";
import { useFinanceMerchants } from "../hooks/useFinance";
import type { FinanceMerchant } from "../types/finance.type";

const columns: Column<FinanceMerchant>[] = [
  { key: "name", header: "Merchant", cell: (r) => <Text as="span" className="font-medium">{r.name}</Text> },
  { key: "email", header: "Email", cell: (r) => r.email },
  { key: "phone", header: "Telepon", cell: (r) => r.phone ?? "-" },
  { key: "status", header: "Status", cell: (r) => <StatusBadge status={String(r.status).toUpperCase()} /> },
  { key: "balance", header: "Saldo", className: "text-right tabular-nums", cell: (r) => formatCurrency(r.balance, { fractionDigits: 0 }) },
  { key: "created", header: "Bergabung", cell: (r) => formatDateTime(r.created_at) },
];

export default function FinanceMerchantsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useFinanceMerchants({ page, per_page: 20 });

  return (
    <Box className="flex flex-col gap-6">
      <Heading level={1}>Merchant</Heading>
      <SimpleTable
        columns={columns}
        rows={data?.rows ?? []}
        isLoading={isLoading}
        isError={isError}
        emptyLabel="Belum ada merchant"
        rowKey={(r) => r.id}
      />
      <Pager page={data?.page ?? page} lastPage={data?.lastPage ?? 1} total={data?.total ?? 0} onPageChange={setPage} />
    </Box>
  );
}
