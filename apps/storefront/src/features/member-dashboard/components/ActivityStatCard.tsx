import React from "react";
import {
  ClipboardList,
  ShieldCheck,
  Receipt,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { useTranslation } from "react-i18next";
import { useParams } from "@tanstack/react-router";
import { formatNumber } from "@/lib/format";
import type { ActivityStat } from "@/features/member-dashboard/types/activityLog.type";

// Per-key visual config
const CONFIG: Record<
  ActivityStat["key"],
  { icon: React.JSX.Element; iconBg: string; iconColor: string; cardBg: string; cardBorder: string }
> = {
  totalActivity: {
    icon: <ClipboardList className="w-5 h-5" />,
    iconBg: "bg-[#60A5FA]/10",
    iconColor: "text-[#60A5FA]",
    cardBg: "",
    cardBorder: "",
  },
  loginSuccess: {
    icon: <ShieldCheck className="w-5 h-5" />,
    iconBg: "bg-[#34D399]/10",
    iconColor: "text-[#34D399]",
    cardBg: "bg-[#0B1A14]",
    cardBorder: "border-[#34D399]/20",
  },
  transaction: {
    icon: <Receipt className="w-5 h-5" />,
    iconBg: "bg-[#FBBF24]/10",
    iconColor: "text-[#FBBF24]",
    cardBg: "bg-[#1A1215]",
    cardBorder: "border-[#FBBF24]/20",
  },
  dataChange: {
    icon: <UserCog className="w-5 h-5" />,
    iconBg: "bg-[rgb(208,201,129)]/10",
    iconColor: "text-[rgb(208,201,129)]",
    cardBg: "bg-[rgb(26,34,16)]",
    cardBorder: "border-[rgb(208,201,129)]/20",
  },
};

const VALUE_COLOR: Record<ActivityStat["key"], string> = {
  totalActivity: "text-white",
  loginSuccess: "text-[#34D399]",
  transaction: "text-[#FBBF24]",
  dataChange: "text-[rgb(208,201,129)]",
};

interface Props {
  stat: ActivityStat;
  className?: string;
}

export default function ActivityStatCard({ stat, className }: Props): React.JSX.Element {
  const { t } = useTranslation("dashboard");
  const { locale = "id" } = useParams({ strict: false }) as { locale?: string };
  const cfg = CONFIG[stat.key];

  const cardContent = (
    <Box className="flex items-center justify-between gap-3 w-full">
      {/* Left: label + value + trend + subtitle */}
      <Box className="flex flex-col gap-1.5 min-w-0">
        <Text
          as="span"
          className="text-[12px] font-inter text-white/50 uppercase tracking-wide leading-none"
        >
          {t(stat.labelKey)}
        </Text>

        <Text
          as="span"
          className={cn(
            "font-plex font-bold text-[28px] leading-none",
            VALUE_COLOR[stat.key],
          )}
        >
          {formatNumber(stat.value, locale)}
        </Text>

        {/* Trend badge */}
        <Box className="flex items-center gap-1.5">
          <Box
            className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-plex font-bold leading-none",
              stat.trendUp
                ? "bg-[#065F46]/30 text-[#34D399]"
                : "bg-[#7F1D1D]/30 text-[#F87171]",
            )}
          >
            {stat.trend}
          </Box>
        </Box>

        <Text as="span" className="text-[11px] font-inter text-white/30 leading-none">
          {t(stat.subtitleKey)}
        </Text>
      </Box>

      {/* Right: icon circle */}
      <Box
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
          cfg.iconBg,
          cfg.iconColor,
        )}
      >
        {cfg.icon}
      </Box>
    </Box>
  );

  /* totalActivity — gradient border + dark forest (same neutral pattern as StatCard) */
  if (stat.key === "totalActivity") {
    return (
      <Box className={cn("p-[1px] rounded-2xl bg-linear-to-br from-[rgb(67,86,32)] to-[rgb(208,201,129)]", className)}>
        <Box className="bg-[rgb(14,20,10)] rounded-[15px] p-4 flex items-center h-full">
          {cardContent}
        </Box>
      </Box>
    );
  }

  /* Colored status cards */
  return (
    <Box
      className={cn(
        "relative rounded-2xl border p-4 flex items-center",
        cfg.cardBg,
        cfg.cardBorder,
        className,
      )}
    >
      {cardContent}
    </Box>
  );
}
