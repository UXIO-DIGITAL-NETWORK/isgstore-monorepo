import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  LayoutGrid,
  Clock,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { cn } from "@/lib/utils";
import { useTransactionHistory } from "@/features/member-dashboard/hooks/useTransactionHistory";
import { useMemberTransactionsRealtime } from "@/features/member-dashboard/hooks/useMemberTransactionsRealtime";
import InvoiceSearchCard from "@/features/member-dashboard/components/InvoiceSearchCard";
import TransactionHistoryTable from "@/features/member-dashboard/components/TransactionHistoryTable";
import HistorySortDropdown from "@/features/member-dashboard/components/HistorySortDropdown";
import HistoryFilterPanel from "@/features/member-dashboard/components/HistoryFilterPanel";
import TablePagination from "@/features/member-dashboard/components/TablePagination";
import type {
  RecentTransactionStatus,
  HistoryFilterValues,
} from "@/features/member-dashboard/types/dashboard.type";

type StatusFilter = "all" | RecentTransactionStatus;

const PAGE_SIZE = 5;

const EMPTY_FILTERS: HistoryFilterValues = {
  service: "",
  payment: "",
  dateFrom: "",
  dateTo: "",
};

const STATUS_FILTERS: {
  key: StatusFilter;
  labelKey: string;
  icon: React.ReactNode;
}[] = [
  {
    key: "all",
    labelKey: "transactionHistory.filters.all",
    icon: <LayoutGrid className="w-3.5 h-3.5" />,
  },
  {
    key: "pending",
    labelKey: "transactionHistory.filters.pending",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  {
    key: "process",
    labelKey: "transactionHistory.filters.process",
    icon: <RefreshCw className="w-3.5 h-3.5" />,
  },
  {
    key: "success",
    labelKey: "transactionHistory.filters.success",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  {
    key: "failed",
    labelKey: "transactionHistory.filters.failed",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
];

export default function TransactionHistoryPage(): React.JSX.Element {
  const { t } = useTranslation("dashboard");
  const allRows = useTransactionHistory();
  // Live-refresh the history as the member's orders change status.
  useMemberTransactionsRealtime();

  // Search (applied on click)
  const [appliedSearch, setAppliedSearch] = useState("");
  // Status filter pill
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  // Filter panel visibility
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  // Applied filter panel values
  const [appliedFilters, setAppliedFilters] = useState<HistoryFilterValues>(EMPTY_FILTERS);
  // Pagination
  const [page, setPage] = useState(1);

  const handleSearch = (value: string) => {
    setAppliedSearch(value);
    setPage(1);
  };
  const handleStatusFilter = (key: StatusFilter) => {
    setStatusFilter(key);
    setPage(1);
  };
  const handleFilterApply = (values: HistoryFilterValues) => {
    setAppliedFilters(values);
    setPage(1);
  };
  const handleFilterReset = () => {
    setAppliedFilters(EMPTY_FILTERS);
    setPage(1);
  };

  // Derive unique service names for the Layanan dropdown
  const serviceOptions = useMemo(
    () => [...new Set(allRows.map((r) => r.serviceName))],
    [allRows],
  );

  const filtered = useMemo(() => {
    const q = appliedSearch.toLowerCase();
    const { service, payment, dateFrom, dateTo } = appliedFilters;

    return allRows.filter((row) => {
      const matchSearch = !q || row.invoiceNumber.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || row.status === statusFilter;
      const matchService = !service || row.serviceName === service;
      const matchPayment = !payment || row.paymentMethod === payment;
      const rowDate = new Date(row.date);
      const matchDateFrom = !dateFrom || rowDate >= new Date(dateFrom);
      const matchDateTo = !dateTo || rowDate <= new Date(dateTo + "T23:59:59");
      return matchSearch && matchStatus && matchService && matchPayment && matchDateFrom && matchDateTo;
    });
  }, [allRows, appliedSearch, statusFilter, appliedFilters]);

  // Default sort: newest first
  const sorted = useMemo(
    () => [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [filtered],
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageRows = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Box className="flex flex-col gap-5">
      {/* Page header */}
      <Box className="flex flex-col gap-1">
        <Box className="flex items-center gap-3">
          <Box className="w-1 h-7 rounded-full bg-linear-to-b from-[rgb(67,86,32)] to-[rgb(208,201,129)]" />
          <Box
            as="h2"
            className="font-outfit font-bold text-[22px] text-white uppercase tracking-wide leading-tight"
          >
            {t("transactionHistory.title")}
          </Box>
        </Box>
        <Text as="p" className="text-[13px] font-inter text-white/50 leading-snug pl-4">
          {t("transactionHistory.subtitle")}
        </Text>
      </Box>

      {/* Cari Invoice card */}
      <InvoiceSearchCard onSearch={handleSearch} />

      {/* STATUS label + filter pills + Filter toggle */}
      <Box className="flex flex-col gap-3">
        <Text
          as="span"
          className="text-[12px] font-outfit font-bold text-white/50 uppercase tracking-widest leading-none"
        >
          {t("transactionHistory.statusLabel")}
        </Text>

        <Box className="flex items-center gap-2 flex-wrap">
          {/* Status pills with icons */}
          {STATUS_FILTERS.map(({ key, labelKey, icon }) => (
            <Box
              as="button"
              type="button"
              key={key}
              onClick={() => handleStatusFilter(key)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-outfit font-semibold leading-none transition-all cursor-pointer",
                statusFilter === key
                  ? "bg-[rgb(208,201,129)] text-white"
                  : "bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/8",
              )}
            >
              {icon}
              {t(labelKey)}
            </Box>
          ))}

          {/* Filter panel toggle */}
          <Box className="ml-auto">
            <HistorySortDropdown
              open={filterPanelOpen}
              onToggle={() => setFilterPanelOpen((prev) => !prev)}
            />
          </Box>
        </Box>

        {/* Filter panel — slides in below the pills row */}
        {filterPanelOpen && (
          <HistoryFilterPanel
            serviceOptions={serviceOptions}
            onApply={handleFilterApply}
            onReset={handleFilterReset}
          />
        )}
      </Box>

      {/* Table + pagination wrapper */}
      <Box className="rounded-2xl border border-white/10 overflow-hidden">
        <TransactionHistoryTable rows={pageRows} />
        <TablePagination page={page} totalPages={totalPages} onChange={setPage} />
      </Box>
    </Box>
  );
}
