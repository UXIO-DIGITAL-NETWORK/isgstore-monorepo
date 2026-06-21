import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Download } from "lucide-react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { useActivityLog } from "@/features/member-dashboard/hooks/useActivityLog";
import { MOCK_ACTIVITY_STATS } from "@/features/member-dashboard/data/activity-log.mock";
import ActivityLogFilterBar from "@/features/member-dashboard/components/ActivityLogFilterBar";
import ActivityStatCard from "@/features/member-dashboard/components/ActivityStatCard";
import ActivityLogTable from "@/features/member-dashboard/components/ActivityLogTable";
import TablePagination from "@/features/member-dashboard/components/TablePagination";
import type { ActivityLogFilterValues } from "@/features/member-dashboard/types/activityLog.type";

const PAGE_SIZE = 5;

const EMPTY_FILTERS: ActivityLogFilterValues = {
  status: "all",
  ip: "",
  dateFrom: "",
  dateTo: "",
};

export default function ActivityLogPage(): React.JSX.Element {
  const { t } = useTranslation("dashboard");
  const allRows = useActivityLog();

  // Applied filter values (set on "Terapkan Filter")
  const [appliedFilters, setAppliedFilters] = useState<ActivityLogFilterValues>(EMPTY_FILTERS);
  // Current page
  const [page, setPage] = useState(1);

  const handleFilterApply = (values: ActivityLogFilterValues) => {
    setAppliedFilters(values);
    setPage(1);
  };

  const handleFilterReset = () => {
    setAppliedFilters(EMPTY_FILTERS);
    setPage(1);
  };

  // Client-side filtering
  const filtered = useMemo(() => {
    const { status, ip, dateFrom, dateTo } = appliedFilters;

    return allRows.filter((row) => {
      const matchStatus = status === "all" || row.type === status;
      const matchIp = !ip || row.ip.includes(ip) || row.location.toLowerCase().includes(ip.toLowerCase());
      const rowDate = new Date(row.date);
      const matchDateFrom = !dateFrom || rowDate >= new Date(dateFrom);
      const matchDateTo = !dateTo || rowDate <= new Date(dateTo + "T23:59:59");
      return matchStatus && matchIp && matchDateFrom && matchDateTo;
    });
  }, [allRows, appliedFilters]);

  // Default sort: newest first
  const sorted = useMemo(
    () => [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [filtered],
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageRows = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Box className="flex flex-col gap-6">
      {/* ── Page header ── */}
      <Box className="flex items-start justify-between gap-4 flex-wrap">
        <Box className="flex flex-col gap-1">
          <Box className="flex items-center gap-3">
            <Box className="w-1 h-7 rounded-full bg-linear-to-b from-[#3B82F6] to-[#9234EA]" />
            <Box
              as="h2"
              className="font-outfit font-bold text-[22px] text-white uppercase tracking-wide leading-tight"
            >
              {t("activityLog.title")}
            </Box>
          </Box>
          <Text as="p" className="text-[13px] font-inter text-white/50 leading-snug pl-4">
            {t("activityLog.subtitle")}
          </Text>
        </Box>

        {/* Ekspor Log — static no-op button */}
        <Box
          as="button"
          type="button"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[13px] font-outfit font-semibold text-white/70 hover:bg-white/8 hover:text-white transition-all cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4" />
          {t("activityLog.exportButton")}
        </Box>
      </Box>

      {/* ── Filter bar ── */}
      <ActivityLogFilterBar onApply={handleFilterApply} onReset={handleFilterReset} />

      {/* ── 4 stat cards ── */}
      <Box className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {MOCK_ACTIVITY_STATS.map((stat) => (
          <ActivityStatCard key={stat.key} stat={stat} />
        ))}
      </Box>

      {/* ── "AKTIVITAS AKUN ANDA" section heading ── */}
      <Box className="flex items-center gap-3">
        <Box className="w-1 h-5 rounded-full bg-linear-to-b from-[#3B82F6] to-[#9234EA]" />
        <Text
          as="span"
          className="text-[13px] font-outfit font-bold text-white/70 uppercase tracking-widest leading-none"
        >
          {t("activityLog.sectionTitle")}
        </Text>
      </Box>

      {/* ── Table + pagination ── */}
      <Box className="rounded-2xl border border-white/10 overflow-hidden">
        <ActivityLogTable rows={pageRows} />
        <TablePagination page={page} totalPages={totalPages} onChange={setPage} />
      </Box>
    </Box>
  );
}
