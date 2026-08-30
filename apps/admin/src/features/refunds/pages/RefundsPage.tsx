import { useMemo, useState } from "react";

import { Box } from "@/components/common/Box";
import { DataTable } from "@/components/common/DataTable";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";
import { formatCurrency } from "@/utils/currency";
import { refundColumns } from "../components/refundColumns";
import { RefundFilterBar } from "../components/RefundFilterBar";
import { useRefundList, useRefundStatusCounts } from "../hooks/useRefunds";
import type { RefundListParams, RefundStatus } from "../types/refund.type";

const DEFAULT_PAGE_SIZE = 10;

/**
 * The pills answer the only question an operator opens this page with: how
 * much money is waiting on me, and on whom. `WAITING_DETAILS` is on the
 * customer; `PENDING` and `PROCESSING` are on us.
 */
const PILLS: { status: RefundStatus; label: string; hint: string; accent: string }[] = [
  {
    status: "WAITING_DETAILS",
    label: "Awaiting details",
    hint: "The customer has not told us where to send it yet",
    accent: "border-border bg-muted/40",
  },
  {
    status: "PENDING",
    label: "Ready to transfer",
    hint: "Account on file — waiting for someone to send the money",
    accent: "border-warning bg-warning/10",
  },
  {
    status: "PROCESSING",
    label: "In progress",
    hint: "An admin has claimed it and is transferring",
    accent: "border-chart-1 bg-chart-1/10",
  },
  {
    status: "COMPLETED",
    label: "Completed",
    hint: "Money has left",
    accent: "border-success bg-success/10",
  },
];

export default function RefundsPage() {
  const [filters, setFilters] = useState<RefundListParams>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const params = useMemo(() => ({ ...filters, page, per_page: pageSize }), [filters, page, pageSize]);
  const { data, isLoading, isError, refetch } = useRefundList(params);
  const { data: counts = {} } = useRefundStatusCounts();

  const handleFilterChange = (next: RefundListParams) => {
    setFilters(next);
    setPage(1);
  };

  const outstanding = (data?.data ?? [])
    .filter((refund) => refund.status === "WAITING_DETAILS" || refund.status === "PENDING" || refund.status === "PROCESSING")
    .reduce((total, refund) => total + refund.amount, 0);

  return (
    <Box className="flex flex-col gap-6">
      <Box className="border-border bg-card flex flex-col gap-4 rounded-2xl border p-6 sm:flex-row sm:items-start sm:justify-between">
        <Box>
          <Heading
            level={1}
            variant="section"
          >
            Refunds
          </Heading>
          <Text variant="muted">
            Money owed back to customers. A registered member is credited to their balance automatically; a guest is
            transferred by hand from here.
          </Text>
        </Box>
        {outstanding > 0 && (
          <Box className="border-border shrink-0 rounded-xl border px-4 py-2 text-right">
            <Text
              variant="muted"
              as="span"
            >
              Outstanding on this page
            </Text>
            <Text
              as="p"
              className="text-lg font-semibold tabular-nums"
            >
              {formatCurrency(outstanding, { fractionDigits: 0 })}
            </Text>
          </Box>
        )}
      </Box>

      <Box className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {PILLS.map((pill) => {
          const active = filters.status === pill.status;

          return (
            <button
              key={pill.status}
              type="button"
              aria-pressed={active}
              onClick={() => handleFilterChange({ ...filters, status: active ? undefined : pill.status })}
              className={`flex flex-col gap-1 rounded-2xl border p-4 text-left transition-colors ${pill.accent} ${
                active ? "ring-ring ring-2" : ""
              }`}
            >
              <Text
                variant="muted"
                as="span"
              >
                {pill.label}
              </Text>
              <Text
                as="span"
                className="text-2xl font-semibold tabular-nums"
              >
                {counts[pill.status] ?? 0}
              </Text>
              <Text
                variant="muted"
                as="span"
                className="text-xs"
              >
                {pill.hint}
              </Text>
            </button>
          );
        })}
      </Box>

      <RefundFilterBar
        filters={filters}
        onChange={handleFilterChange}
      />

      <DataTable
        columns={refundColumns}
        data={data?.data ?? []}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        entityLabel="refunds"
        emptyMessage="No refunds match these filters."
        showRowNumber
        enableSelection={false}
        page={data?.meta.current_page ?? page}
        pageSize={pageSize}
        total={data?.meta.total ?? 0}
        lastPage={data?.meta.last_page ?? 1}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />
    </Box>
  );
}
