import { useMemo, useState } from "react";
import type { SortingState } from "@tanstack/react-table";
import { endOfDay, startOfDay } from "date-fns";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";
import { automaticColumns } from "../components/automaticColumns";
import { ExportButton } from "../components/ExportButton";
import { RecapButton } from "../components/RecapButton";
import { StatusPills } from "../components/StatusPills";
import { TransactionFilterBar, type TransactionFilters } from "../components/TransactionFilterBar";
import { TransactionsTable } from "../components/TransactionsTable";
import { useTransactionList } from "../hooks/useTransactions";
import { useTransactionsRealtime } from "../hooks/useTransactionsRealtime";
import type { TransactionStatus } from "../types/transaction.type";

const DEFAULT_PAGE_SIZE = 10;

export default function AutomaticTransactionsPage() {
  const [filters, setFilters] = useState<TransactionFilters>(() => {
    // Day boundaries, not `new Date().toISOString()` twice — the service
    // compares created_at against these as raw ISO strings, so an identical
    // start/end instant is a zero-width window that matches nothing.
    const now = new Date();
    return { startDate: startOfDay(now).toISOString(), endDate: endOfDay(now).toISOString() };
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sorting, setSorting] = useState<SortingState>([]);

  const params = useMemo(
    () => ({
      ...filters,
      page,
      per_page: pageSize,
      sortBy: sorting[0]?.id,
      sortDir: sorting[0] ? (sorting[0].desc ? ("desc" as const) : ("asc" as const)) : undefined,
    }),
    [filters, page, pageSize, sorting],
  );
  const { data, isLoading, isError, refetch } = useTransactionList(params);
  // Push new/updated transactions into the table live; the poll above is fallback.
  useTransactionsRealtime();

  const handleFilterChange = (patch: Partial<TransactionFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  };

  const handleTogglePill = (status: TransactionStatus) => {
    handleFilterChange({ invoiceStatus: filters.invoiceStatus === status ? undefined : status });
  };

  return (
    <Box className="flex flex-col gap-6">
      <Box className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-card p-6">
        <Box>
          <Heading
            level={1}
            variant="section"
          >
            Automatic Transaction History
          </Heading>
          <Text variant="muted">
            Monitor all automated transactions that have been processed along with their status and details.
          </Text>
        </Box>
        <Box className="flex shrink-0 gap-3">
          <RecapButton />
          <ExportButton params={params} />
        </Box>
      </Box>

      <StatusPills
        active={filters.invoiceStatus ?? null}
        onToggle={handleTogglePill}
      />

      <Box className="flex flex-col gap-9 rounded-2xl border border-border bg-card p-4">
        <TransactionFilterBar
          filters={filters}
          onChange={handleFilterChange}
        />
        <TransactionsTable
          columns={automaticColumns}
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
          sorting={sorting}
          onSortingChange={setSorting}
        />
      </Box>
    </Box>
  );
}
