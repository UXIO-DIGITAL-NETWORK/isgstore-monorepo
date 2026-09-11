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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ListParams } from "@/lib/list";
import { formatCurrency } from "@/utils/currency";
import { formatDateTime } from "@/utils/date";
import type { FinanceUnifiedTransaction, TransactionType } from "@/types/transaction.type";

import { financeService } from "../services/finance.service";
import { useFinanceMerchants, useFinanceTransactions, useFinanceTransactionSummary } from "../hooks/useFinance";

const money = (v: number) => formatCurrency(v, { fractionDigits: 0 });

const TYPE_LABEL: Record<TransactionType, string> = {
  sale: "Penjualan",
  service: "Tagihan Layanan",
};

// The whole feed: topup sales and the service bills kita issues clients. A
// service row carries no payment channel and zero admin/gateway fee, so its
// entire amount is kita's profit.
/**
 * A factory rather than a module constant: column headers are rendered text, so
 * they have to resolve when the component renders.
 */
const columnsFor = (t: TFunction<"finance">): Column<FinanceUnifiedTransaction>[] => [
  {
    key: "invoice",
    header: t("transactions.colInvoice"),
    cell: (r) => (
      <Box className="flex flex-col">
        <Text as="span" className="font-medium">
          {r.invoice_number}
        </Text>
        <Text as="span" variant="small" className="text-muted-foreground">
          {TYPE_LABEL[r.type]}
        </Text>
      </Box>
    ),
  },
  { key: "merchant", header: t("transactions.colClient"), cell: (r) => r.merchant?.name ?? "-" },
  { key: "title", header: t("transactions.colItem"), cell: (r) => r.title ?? "-" },
  {
    key: "total",
    header: t("transactions.colAmount"),
    className: "text-right tabular-nums",
    cell: (r) => (
      <Box className="flex flex-col items-end">
        <Text as="span" className="tabular-nums">
          {money(r.amount_total)}
        </Text>
        <Text as="span" variant="small" className="text-muted-foreground tabular-nums">
          Net +{money(r.amount)}
        </Text>
      </Box>
    ),
  },
  {
    key: "admin_fee",
    header: t("transactions.colAdminFee"),
    className: "text-right tabular-nums",
    cell: (r) => money(r.admin_fee),
  },
  {
    key: "gateway",
    header: t("transactions.colGatewayFee"),
    className: "text-right tabular-nums",
    cell: (r) => money(r.gateway_fee),
  },
  {
    key: "profit",
    header: t("transactions.colProfit"),
    className: "text-right tabular-nums",
    cell: (r) => (
      <Text as="span" className="text-success tabular-nums">
        {money(r.platform_profit)}
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
    cell: (r) => <ProviderStatusBadge status={resolveProviderStatus(r)} audience="internal" />,
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

export default function FinanceTransactionsPage() {
  const { t } = useTranslation("finance");
  const columns = columnsFor(t);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<TransactionFilterState>(INITIAL_FILTERS);
  const [merchantId, setMerchantId] = useState(""); // "" = every client
  const debouncedSearch = useDebouncedValue(filters.search, 300);

  const merchants = useFinanceMerchants({ per_page: 100 });

  const filterParams: ListParams = {
    type: filters.type,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(filters.statusGroup ? { status_group: filters.statusGroup } : {}),
    ...(filters.startDate ? { start_date: filters.startDate } : {}),
    ...(filters.endDate ? { end_date: filters.endDate } : {}),
    ...(merchantId ? { merchant_id: Number(merchantId) } : {}),
  };
  const listParams: ListParams = { ...filterParams, page, per_page: 20 };

  const { data, isLoading, isError } = useFinanceTransactions(listParams);
  const summary = useFinanceTransactionSummary(filterParams);

  const patch = (next: Partial<TransactionFilterState>) => {
    setFilters((current) => ({ ...current, ...next }));
    setPage(1);
  };

  const merchantSelect = (
    <Select
      value={merchantId || "all"}
      onValueChange={(next) => {
        setMerchantId(next === "all" ? "" : next);
        setPage(1);
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={t("transactions.allClients")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t("transactions.allClients")}</SelectItem>
        {(merchants.data?.rows ?? []).map((merchant) => (
          <SelectItem key={merchant.id} value={String(merchant.id)}>
            {merchant.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <Box className="flex flex-col gap-6">
      <Box className="flex flex-wrap items-center justify-between gap-3">
        <Heading level={1}>{t("transactions.title")}</Heading>
        <Box className="flex items-center gap-2">
          <RecapDialog summary={summary.data} isInternal isLoading={summary.isLoading} />
          <ExportButton onExport={() => financeService.exportTransactions(filterParams)} />
        </Box>
      </Box>

      <TransactionSummaryPills
        counts={summary.data}
        active={filters.statusGroup}
        onToggle={(group) => patch({ statusGroup: group })}
        isLoading={summary.isLoading}
      />

      <TransactionFilters value={filters} onChange={patch} extra={merchantSelect} />

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
