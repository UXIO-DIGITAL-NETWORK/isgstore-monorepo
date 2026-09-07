import React from "react";
import {
  LogIn,
  Crown,
  Receipt,
  ShieldCheck,
  BadgeCheck,
  XCircle,
  MapPin,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useParams } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { formatDateTime } from "@/lib/format";
import ActivityStatusBadge from "@/features/member-dashboard/components/ActivityStatusBadge";
import type {
  ActivityLogRow,
  ActivityType,
} from "@/features/member-dashboard/types/activityLog.type";

// Per-type icon + circle styling
const TYPE_CONFIG: Record<
  ActivityType,
  { icon: React.JSX.Element; bg: string; color: string }
> = {
  login:        { icon: <LogIn className="w-4 h-4" />,      bg: "bg-[#34D399]/10", color: "text-[#34D399]" },
  membership:   { icon: <Crown className="w-4 h-4" />,      bg: "bg-[#9234EA]/10", color: "text-[#C084FC]" },
  transaction:  { icon: <Receipt className="w-4 h-4" />,    bg: "bg-[#3B82F6]/10", color: "text-[#60A5FA]" },
  security:     { icon: <ShieldCheck className="w-4 h-4" />, bg: "bg-[#FBBF24]/10", color: "text-[#FBBF24]" },
  verification: { icon: <BadgeCheck className="w-4 h-4" />, bg: "bg-[#06B6D4]/10", color: "text-[#22D3EE]" },
  failed:       { icon: <XCircle className="w-4 h-4" />,    bg: "bg-[#F87171]/10", color: "text-[#F87171]" },
};

interface Props {
  rows: ActivityLogRow[];
}

export default function ActivityLogTable({ rows }: Props): React.JSX.Element {
  const { t } = useTranslation("dashboard");
  const { locale = "id" } = useParams({ strict: false }) as { locale?: string };

  return (
    <Box className="overflow-x-auto">
      <Box as="table" className="w-full border-collapse">
        {/* Header */}
        <Box as="thead">
          <Box as="tr" className="bg-[#3A1D6E]">
            <Box
              as="th"
              className="text-left px-4 py-3.5 text-[12px] font-outfit font-semibold text-white/80 leading-none"
            >
              {t("activityLog.columns.activity")}
            </Box>
            <Box
              as="th"
              className="text-left px-4 py-3.5 text-[12px] font-outfit font-semibold text-white/80 leading-none hidden sm:table-cell"
            >
              {t("activityLog.columns.time")}
            </Box>
            <Box
              as="th"
              className="text-left px-4 py-3.5 text-[12px] font-outfit font-semibold text-white/80 leading-none hidden md:table-cell"
            >
              {t("activityLog.columns.ip")}
            </Box>
            <Box
              as="th"
              className="text-center px-4 py-3.5 text-[12px] font-outfit font-semibold text-white/80 leading-none"
            >
              {t("activityLog.columns.status")}
            </Box>
          </Box>
        </Box>

        {/* Body */}
        <Box as="tbody">
          {rows.length > 0 ? (
            rows.map((row, idx) => {
              const cfg = TYPE_CONFIG[row.type];
              const dt = formatDateTime(row.date, locale);
              // Split formatted date-time into date and time parts (e.g. "22 Mei 2025, 20:49")
              const [datePart, timePart] = dt.split(", ");

              return (
                <Box
                  as="tr"
                  key={row.id}
                  className={cn(
                    "border-b border-white/[0.04] last:border-0",
                    idx % 2 === 0 ? "bg-white/[0.015]" : "bg-transparent",
                  )}
                >
                  {/* Aktivitas — icon circle + title + desc */}
                  <Box as="td" className="px-4 py-3.5 align-middle">
                    <Box className="flex items-center gap-3">
                      <Box
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                          cfg.bg,
                          cfg.color,
                        )}
                      >
                        {cfg.icon}
                      </Box>
                      <Box className="flex flex-col gap-0.5 min-w-0">
                        <Text
                          as="span"
                          className="text-[13px] font-inter font-semibold text-white leading-tight truncate"
                        >
                          {t(row.titleKey)}
                        </Text>
                        <Text
                          as="span"
                          className="text-[11px] font-inter text-white/40 leading-none truncate"
                        >
                          {t(row.descKey)}
                        </Text>
                      </Box>
                    </Box>
                  </Box>

                  {/* Waktu */}
                  <Box as="td" className="px-4 py-3.5 align-middle hidden sm:table-cell">
                    <Box className="flex flex-col gap-0.5">
                      <Text
                        as="span"
                        className="text-[12px] font-inter text-white/70 leading-tight whitespace-nowrap"
                      >
                        {datePart}
                      </Text>
                      <Text
                        as="span"
                        className="text-[11px] font-plex text-white/40 leading-none"
                      >
                        {timePart}
                      </Text>
                    </Box>
                  </Box>

                  {/* IP Address */}
                  <Box as="td" className="px-4 py-3.5 align-middle hidden md:table-cell">
                    <Box className="flex flex-col gap-0.5">
                      <Text
                        as="span"
                        className="text-[12px] font-plex font-semibold text-white/70 leading-tight whitespace-nowrap"
                      >
                        {row.ip}
                      </Text>
                      <Box className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-white/30 shrink-0" />
                        <Text
                          as="span"
                          className="text-[11px] font-inter text-white/40 leading-none"
                        >
                          {row.location}
                        </Text>
                      </Box>
                    </Box>
                  </Box>

                  {/* Status badge */}
                  <Box as="td" className="px-4 py-3.5 align-middle text-center">
                    <ActivityStatusBadge type={row.type} />
                  </Box>
                </Box>
              );
            })
          ) : (
            <Box as="tr">
              <Box as="td" className="px-4 py-10 text-center" colSpan={4}>
                <Text as="span" className="text-[13px] font-inter text-white/30">
                  {t("activityLog.noActivity")}
                </Text>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
