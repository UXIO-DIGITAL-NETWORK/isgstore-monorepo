import { useMemo, useState } from "react";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";
import { manualColumns } from "../components/manualColumns";
import { TransactionFilterBar, type TransactionFilters, type FilterField } from "../components/TransactionFilterBar";
import { TransactionsTable } from "../components/TransactionsTable";
import { useTransactionList } from "../hooks/useTransactions";

const DEFAULT_PAGE_SIZE = 10;
// Manual has no provider/callback fields to filter on (no reference design
// yet — product_requirements.md §4.3) — reduced from the Automatic 10.
const MANUAL_FILTER_FIELDS: FilterField[] = [
  "search",
  "user",
  "category",
  "product",
  "invoiceStatus",
  "startDate",
  "endDate",
];

/** Provisional pending a real Manual design — reuses the Automatic table/filter pattern with fewer columns/fields. */
export default function ManualTransactionsPage() {
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const params = useMemo(() => ({ ...filters, page, per_page: pageSize }), [filters, page, pageSize]);
  const { data, isLoading, isError, refetch } = useTransactionList(params);

  const handleFilterChange = (patch: Partial<TransactionFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  };

  return (
    <Box className="flex flex-col gap-6">
      <Box className="rounded-xl border border-border bg-card p-6">
        <Heading
          level={1}
          variant="section"
        >
          Manual Transaction History
        </Heading>
        <Text variant="muted">Review transactions entered or overridden manually by an operator.</Text>
      </Box>

      <Box className="rounded-2xl border border-border bg-card p-4">
        <TransactionFilterBar
          filters={filters}
          onChange={handleFilterChange}
          fields={MANUAL_FILTER_FIELDS}
        />
      </Box>

      <Box className="rounded-2xl border border-border bg-card p-4">
        <TransactionsTable
          columns={manualColumns}
          data={data?.data ?? []}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetch()}
          page={data?.meta.current_page ?? page}
          pageSize={data?.meta.per_page ?? pageSize}
          total={data?.meta.total ?? 0}
          lastPage={data?.meta.last_page ?? 1}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </Box>
    </Box>
  );
}
