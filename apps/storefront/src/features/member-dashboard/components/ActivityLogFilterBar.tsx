import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Calendar, ChevronDown, Search, RotateCcw } from "lucide-react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import type {
  ActivityLogFilterValues,
  ActivityType,
} from "@/features/member-dashboard/types/activityLog.type";

interface Props {
  onApply: (values: ActivityLogFilterValues) => void;
  onReset: () => void;
}

const ACTIVITY_TYPES: ActivityType[] = [
  "login",
  "membership",
  "transaction",
  "security",
  "verification",
  "failed",
];

const EMPTY: ActivityLogFilterValues = {
  status: "all",
  ip: "",
  dateFrom: "",
  dateTo: "",
};

export default function ActivityLogFilterBar({ onApply, onReset }: Props): React.JSX.Element {
  const { t } = useTranslation("dashboard");
  const [draft, setDraft] = useState<ActivityLogFilterValues>(EMPTY);

  const handleReset = () => {
    setDraft(EMPTY);
    onReset();
  };

  const handleApply = () => {
    onApply(draft);
  };

  return (
    // Gradient border wrapper — consistent with InvoiceSearchCard / HistoryFilterPanel
    <Box className="p-px rounded-2xl bg-linear-to-r from-[#3B82F6] to-[#9234EA]">
      <Box className="bg-[#0C0E1A] rounded-[15px] p-5 flex flex-col gap-5">
        {/* 3-column filter row */}
        <Box className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* ── Tanggal ── */}
          <Box className="flex flex-col gap-2">
            <Text
              as="span"
              className="text-[13px] font-outfit font-semibold text-white leading-none"
            >
              {t("activityLog.filter.dateLabel")}
            </Text>
            <Box className="flex items-center gap-2 bg-[#080A14] border border-white/10 rounded-xl px-4 py-3">
              <Calendar className="w-4 h-4 text-white/40 shrink-0" />
              <Box
                as="input"
                type="date"
                value={draft.dateFrom}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setDraft((prev) => ({ ...prev, dateFrom: e.target.value }))
                }
                className="flex-1 min-w-0 bg-transparent text-[12px] font-inter text-white/70 outline-none [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
              />
              <Text as="span" className="text-white/30 shrink-0 text-[13px] select-none">
                -
              </Text>
              <Box
                as="input"
                type="date"
                value={draft.dateTo}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setDraft((prev) => ({ ...prev, dateTo: e.target.value }))
                }
                className="flex-1 min-w-0 bg-transparent text-[12px] font-inter text-white/70 outline-none [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
              />
              <Calendar className="w-4 h-4 text-white/40 shrink-0" />
            </Box>
          </Box>

          {/* ── Status ── */}
          <Box className="flex flex-col gap-2">
            <Text
              as="span"
              className="text-[13px] font-outfit font-semibold text-white leading-none"
            >
              {t("activityLog.filter.statusLabel")}
            </Text>
            <Box className="relative">
              <Box
                as="select"
                value={draft.status}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setDraft((prev) => ({
                    ...prev,
                    status: e.target.value as ActivityLogFilterValues["status"],
                  }))
                }
                className="w-full appearance-none bg-[#080A14] border border-white/10 rounded-xl px-4 py-3 pr-10 text-[13px] font-inter text-white outline-none focus:border-[#3B82F6]/50 transition-colors cursor-pointer"
              >
                <option value="all">{t("activityLog.filter.allActions")}</option>
                {ACTIVITY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(`activityLog.filter.statusOptions.${type}`)}
                  </option>
                ))}
              </Box>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            </Box>
          </Box>

          {/* ── IP Address ── */}
          <Box className="flex flex-col gap-2">
            <Text
              as="span"
              className="text-[13px] font-outfit font-semibold text-white leading-none"
            >
              {t("activityLog.filter.ipLabel")}
            </Text>
            <Box className="relative">
              <Box
                as="input"
                type="text"
                value={draft.ip}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setDraft((prev) => ({ ...prev, ip: e.target.value }))
                }
                placeholder={t("activityLog.filter.ipPlaceholder")}
                className="w-full bg-[#080A14] border border-white/10 rounded-xl px-4 py-3 pl-10 text-[13px] font-inter text-white placeholder:text-white/30 outline-none focus:border-[#3B82F6]/50 transition-colors"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            </Box>
          </Box>
        </Box>

        {/* ── Action buttons ── */}
        <Box className="flex justify-end gap-3">
          {/* Reset Filter */}
          <Box
            as="button"
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-[13px] font-outfit font-semibold text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {t("activityLog.filter.reset")}
          </Box>

          {/* Terapkan Filter */}
          <Box
            as="button"
            type="button"
            onClick={handleApply}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-linear-to-r from-[#3B82F6] to-[#9234EA] text-[13px] font-outfit font-bold text-white hover:opacity-90 transition-opacity cursor-pointer"
          >
            {t("activityLog.filter.apply")}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
