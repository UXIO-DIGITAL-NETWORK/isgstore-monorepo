import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useState } from "react";

import { Box } from "@/components/common/Box";
import { ExportButton } from "@/components/common/ExportButton";
import { Heading } from "@/components/common/Heading";
import { Pager } from "@/components/common/Pager";
import { RecapDialog } from "@/components/common/RecapDialog";
import { SimpleTable, type Column } from "@/components/common/SimpleTable";
import { PaymentStatusBadge, ProviderStatusBadge } from "@/components/common/TransactionStatusBadges";
import { resolvePaymentStatus, resolveProviderStatus } from "@/lib/transactionStatus";
import { Text } from "@/components/common/Text";
import { TransactionFilters, type TransactionFilterState } from "@/components/common/TransactionFilters";
import { TransactionSummaryPills } from "@/components/common/TransactionSummaryPills";
import { useDebouncedValue } from "@/components/common/useDebouncedValue";
import type { ListParams } from "@/lib/list";
import { formatCurrency } from "@/utils/currency";
import { formatDateTime } from "@/utils/date";
import type { TransactionType, UnifiedTransaction } from "@/types/transaction.type";

import { merchantService } from "../services/merchant.service";
import { useMerchantTransactions, useMerchantTransactionSummary } from "../hooks/useMerchant";

const money = (v: number) => formatCurrency(v, { fractionDigits: 0 });

const TYPE_LABEL_KEY: Record<TransactionType, string> = {
  sale: "transactions.typeSale",
  service: "transactions.typeService",
};

// Both topup sales (money in) and the service bills kita issues the client
// (money out). Direction drives the sign/colour; a service bill has no payment
// channel, so "Metode" falls back to a dash.
/**
 * A factory rather than a module constant: column headers are rendered text, so
 * they have to be resolved when the component renders, not frozen at import.
 */
const columnsFor = (t: TFunction<"merchant">): Column<UnifiedTransaction>[] => [
  {
    key: "invoice",
    header: t("transactions.colInvoice"),
    cell: (r) => (
      <Box className="flex flex-col">
        <Text as="span" className="font-medium">
          {r.invoice_number}
        </Text>
        <Text as="span" variant="small" className="text-muted-foreground">
          {t(TYPE_LABEL_KEY[r.type])}
        </Text>
      </Box>
    ),
  },
  { key: "title", header: t("transactions.colItem"), cell: (r) => r.title ?? "-" },
  { key: "channel", header: t("transactions.colMethod"), cell: (r) => r.payment_channel ?? "—" },
  {
    key: "amount",
    header: t("transactions.colAmount"),
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
  {
    key: "payment_status",
    header: t("transactions.colPayment"),
    cell: (r) => <PaymentStatusBadge status={resolvePaymentStatus(r)} />,
  },
  {
    // Blank on a service bill — kita issued it, no supplier is involved. That is
    // an honest dash, not missing data.
    key: "provider_status",
    header: t("transactions.colProvider"),
    cell: (r) => <ProviderStatusBadge status={resolveProviderStatus(r)} audience="merchant" />,
  },
  { key: "created", header: t("transactions.colDate"), cell: (r) => formatDateTime(r.created_at) },
];

const INITIAL_FILTERS: TransactionFilterState = {
  search: "",
  statusGroup: "",
  type: "all",
  startDate: "",
  endDate: "",
};

export default function MerchantTransactionsPage() {
  const { t } = useTranslation("merchant");
  const columns = columnsFor(t);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<TransactionFilterState>(INITIAL_FILTERS);
  const debouncedSearch = useDebouncedValue(filters.search, 300);

  // Everything the summary pills, the Recap and the Export share; page/per_page
  // belong only to the paginated list.
  const filterParams: ListParams = {
    type: filters.type,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(filters.statusGroup ? { status_group: filters.statusGroup } : {}),
    ...(filters.startDate ? { start_date: filters.startDate } : {}),
    ...(filters.endDate ? { end_date: filters.endDate } : {}),
  };
  const listParams: ListParams = { ...filterParams, page, per_page: 20 };

  const { data, isLoading, isError } = useMerchantTransactions(listParams);
  const summary = useMerchantTransactionSummary(filterParams);

  // Any filter change re-scopes the feed, so an old page number is meaningless.
  const patch = (next: Partial<TransactionFilterState>) => {
    setFilters((current) => ({ ...current, ...next }));
    setPage(1);
  };

  return (
    <Box className="flex flex-col gap-6">
      <Box className="flex flex-wrap items-center justify-between gap-3">
        <Heading level={1}>{t("transactions.title")}</Heading>
        <Box className="flex items-center gap-2">
          <RecapDialog summary={summary.data} isLoading={summary.isLoading} />
          <ExportButton onExport={() => merchantService.exportTransactions(filterParams)} />
        </Box>
      </Box>

      <TransactionSummaryPills
        counts={summary.data}
        active={filters.statusGroup}
        onToggle={(group) => patch({ statusGroup: group })}
        isLoading={summary.isLoading}
      />

      <TransactionFilters value={filters} onChange={patch} />

      <SimpleTable
        columns={columns}
        rows={data?.rows ?? []}
        isLoading={isLoading}
        isError={isError}
        emptyLabel={t("transactions.empty")}
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
