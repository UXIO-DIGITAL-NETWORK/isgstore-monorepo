import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight, Search } from "lucide-react";
import { useParams } from "@tanstack/react-router";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Link } from "@/components/common/Link";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDateTime } from "@/lib/format";
import TransactionStatusBadge from "@/features/member-dashboard/components/TransactionStatusBadge";
import type {
  RecentTransaction,
  RecentTransactionStatus,
} from "@/features/member-dashboard/types/dashboard.type";

type StatusFilter = "all" | RecentTransactionStatus;

interface Props {
  transactions: RecentTransaction[];
}

const STATUS_FILTERS: { key: StatusFilter; labelKey: string }[] = [
  { key: "all",     labelKey: "filter.all" },
  { key: "pending", labelKey: "filter.pending" },
  { key: "success", labelKey: "filter.success" },
  { key: "failed",  labelKey: "filter.failed" },
];

export default function RecentTransactionsTable({ transactions }: Props): React.JSX.Element {
  const { t } = useTranslation("dashboard");
  const { locale = "id" } = useParams({ strict: false }) as { locale?: string };

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions.filter((tx) => {
      const matchStatus = statusFilter === "all" || tx.status === statusFilter;
      const matchSearch =
        !q ||
        tx.serviceName.toLowerCase().includes(q) ||
        tx.invoiceNumber.toLowerCase().includes(q) ||
        tx.serviceDetail.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [transactions, search, statusFilter]);

  return (
    <Box className="flex flex-col gap-3">
      {/* Section title */}
      <Box
        as="h3"
        className="font-outfit font-bold text-[14px] text-white uppercase tracking-widest leading-none mb-1"
      >
        {t("recentTransactions.title")}
      </Box>

      {/* ── Toolbar: search + status filters ── */}
      <Box className="flex flex-col sm:flex-row gap-3 sm:items-center">
        {/* Search input */}
        <Box className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
          <Box
            as="input"
            type="text"
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            placeholder={t("filter.searchPlaceholder")}
            className="w-full bg-[#0C0E1A] border border-white/10 rounded-full pl-8 pr-4 py-2 text-[13px] font-inter text-white placeholder:text-white/25 outline-none focus:border-[#3B82F6]/50 transition-colors"
          />
        </Box>

        {/* Status filter pills */}
        <Box className="flex items-center gap-1.5 flex-wrap">
          {STATUS_FILTERS.map(({ key, labelKey }) => (
            <Box
              key={key}
              as="button"
              type="button"
              onClick={() => setStatusFilter(key)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-[12px] font-outfit font-semibold leading-none transition-all cursor-pointer",
                statusFilter === key
                  ? "bg-linear-to-r from-[#3B82F6] to-[#9234EA] text-white shadow-glow-violet"
                  : "bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/8",
              )}
            >
              {t(labelKey)}
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── Table wrapper ── */}
      <Box className="rounded-2xl border border-white/10 overflow-hidden">
        <Box as="table" className="w-full border-collapse">
          {/* Header */}
          <Box as="thead">
            <Box as="tr" className="bg-[#3A1D6E]">
              <Box as="th" className="text-left px-4 py-3.5 text-[12px] font-outfit font-semibold text-white/80 leading-none">
                {t("recentTransactions.colService")}
              </Box>
              <Box as="th" className="text-left px-4 py-3.5 text-[12px] font-outfit font-semibold text-white/80 leading-none hidden sm:table-cell">
                {t("recentTransactions.colInvoice")}
              </Box>
              <Box as="th" className="text-left px-4 py-3.5 text-[12px] font-outfit font-semibold text-white/80 leading-none hidden md:table-cell">
                {t("recentTransactions.colDate")}
              </Box>
              <Box as="th" className="text-right px-4 py-3.5 text-[12px] font-outfit font-semibold text-white/80 leading-none">
                {t("recentTransactions.colPrice")}
              </Box>
              <Box as="th" className="text-center px-4 py-3.5 text-[12px] font-outfit font-semibold text-white/80 leading-none">
                {t("recentTransactions.colStatus")}
              </Box>
            </Box>
          </Box>

          {/* Body */}
          <Box as="tbody">
            {filtered.length > 0 ? (
              filtered.map((tx, idx) => (
                <Box
                  as="tr"
                  key={tx.id}
                  className={idx % 2 === 0 ? "bg-white/[0.015]" : "bg-transparent"}
                >
                  {/* Service */}
                  <Box as="td" className="px-4 py-3.5 align-middle">
                    <Box className="flex flex-col gap-0.5">
                      <Text as="span" className="text-[13px] font-inter font-medium text-white leading-tight">
                        {tx.serviceName}
                      </Text>
                      <Text as="span" className="text-[11px] font-inter text-white/40 leading-none">
                        {tx.serviceDetail}
                      </Text>
                    </Box>
                  </Box>

                  {/* Invoice */}
                  <Box as="td" className="px-4 py-3.5 align-middle hidden sm:table-cell">
                    <Text as="span" className="text-[12px] font-inter text-white/50 leading-none">
                      {tx.invoiceNumber}
                    </Text>
                  </Box>

                  {/* Date */}
                  <Box as="td" className="px-4 py-3.5 align-middle hidden md:table-cell">
                    <Text as="span" className="text-[12px] font-inter text-white/50 leading-none">
                      {formatDateTime(tx.date, locale)}
                    </Text>
                  </Box>

                  {/* Price */}
                  <Box as="td" className="px-4 py-3.5 align-middle text-right">
                    <Text as="span" className="font-plex font-bold text-[13px] text-white leading-none">
                      {formatCurrency(tx.amount, locale)}
                    </Text>
                  </Box>

                  {/* Status */}
                  <Box as="td" className="px-4 py-3.5 align-middle text-center">
                    <TransactionStatusBadge status={tx.status} />
                  </Box>
                </Box>
              ))
            ) : (
              <Box as="tr">
                <Box as="td" className="px-4 py-8 text-center" colSpan={5}>
                  <Text as="span" className="text-[13px] font-inter text-white/30">
                    {t("noTransactions")}
                  </Text>
                </Box>
              </Box>
            )}
          </Box>
        </Box>

        {/* Footer: "View all" link */}
        <Box className="flex justify-center py-3.5 border-t border-white/8 bg-white/[0.01]">
          <Link
            href={`/${locale}/dashboard-preview`}
            className="flex items-center gap-1 text-[13px] font-outfit font-semibold text-[#9234EA] hover:text-[#C084FC] transition-colors no-underline"
          >
            {t("recentTransactions.viewAll")}
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </Box>
      </Box>
    </Box>
  );
}
