import React from "react";
import { cva } from "class-variance-authority";
import {
  Clock,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ClipboardList,
  ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { useTranslation } from "react-i18next";
import { formatCurrency, formatNumber } from "@/lib/format";
import { useParams } from "@tanstack/react-router";
import type { TransactionStat } from "@/features/member-dashboard/types/dashboard.type";

const coloredCardVariants = cva(
  "relative rounded-2xl border p-4 flex items-center justify-between gap-3 overflow-hidden",
  {
    variants: {
      tone: {
        pending: "bg-[#1A1215] border-[#FBBF24]/20",
        process: "bg-[#0E1A2A] border-[#3B82F6]/20",
        success: "bg-[#0B1A14] border-[#34D399]/20",
        failed:  "bg-[#1A0E0E] border-[#F87171]/20",
        neutral: "",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

const iconBgMap: Record<string, string> = {
  pending: "bg-[#FBBF24]/10",
  process: "bg-[#3B82F6]/10",
  success: "bg-[#34D399]/10",
  failed:  "bg-[#F87171]/10",
  neutral: "bg-white/5",
};

const iconColorMap: Record<string, string> = {
  pending: "text-[#FBBF24]",
  process: "text-[#3B82F6]",
  success: "text-[#34D399]",
  failed:  "text-[#F87171]",
  neutral: "text-white/50",
};

const valueColorMap: Record<string, string> = {
  pending: "text-[#FBBF24]",
  process: "text-[#3B82F6]",
  success: "text-[#34D399]",
  failed:  "text-[#F87171]",
  neutral: "text-white",
};

function StatIcon({ statKey, tone }: { statKey: string; tone: string }): React.JSX.Element {
  const iconClass = cn("w-5 h-5", iconColorMap[tone] ?? "text-white/50");
  const map: Record<string, React.JSX.Element> = {
    pending: <Clock className={iconClass} />,
    process: <RefreshCw className={iconClass} />,
    success: <CheckCircle2 className={iconClass} />,
    failed:  <XCircle className={iconClass} />,
    total:   <ClipboardList className={iconClass} />,
    sales:   <ShoppingBag className={iconClass} />,
  };
  return map[statKey] ?? <ClipboardList className={iconClass} />;
}

interface Props {
  stat: TransactionStat;
  isCurrency?: boolean;
  className?: string;
}

export default function StatCard({ stat, isCurrency = false, className }: Props): React.JSX.Element {
  const { t } = useTranslation("dashboard");
  const { locale = "id" } = useParams({ strict: false }) as { locale?: string };

  const displayValue = isCurrency
    ? formatCurrency(Number(stat.value), locale)
    : formatNumber(Number(stat.value), locale);

  const cardContent = (
    <Box className="flex items-center justify-between gap-3 w-full">
      {/* Left: label + value + trend */}
      <Box className="flex flex-col gap-1.5 min-w-0">
        <Text
          as="span"
          className="text-[12px] font-inter text-white/50 uppercase tracking-wide leading-none"
        >
          {t(stat.labelKey)}
        </Text>

        {isCurrency ? (
          <Box
            as="span"
            className="bg-linear-to-r from-white to-[#E9D5FF] bg-clip-text text-transparent font-plex font-bold text-[24px] leading-none"
          >
            {displayValue}
          </Box>
        ) : (
          <Text
            as="span"
            className={cn("font-plex font-bold text-[28px] leading-none", valueColorMap[stat.tone] ?? "text-white")}
          >
            {displayValue}
          </Text>
        )}

        {stat.trend && (
          <Text as="span" className="text-[11px] font-plex text-[#34D399] font-semibold leading-none">
            {stat.trend}
          </Text>
        )}
      </Box>

      {/* Right: icon circle */}
      <Box
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
          iconBgMap[stat.tone] ?? "bg-white/5",
        )}
      >
        <StatIcon statKey={stat.key} tone={stat.tone} />
      </Box>
    </Box>
  );

  /* Neutral tone (Total Transaksi / Total Penjualan) — gradient border + dark navy */
  if (stat.tone === "neutral") {
    return (
      <Box className={cn("p-[1px] rounded-2xl bg-linear-to-br from-[#3B82F6] to-[#9234EA]", className)}>
        <Box className="bg-[#0C0E1A] rounded-[15px] p-4 flex items-center h-full">
          {cardContent}
        </Box>
      </Box>
    );
  }

  /* Colored status tones */
  return (
    <Box className={cn(coloredCardVariants({ tone: stat.tone }), className)}>
      {cardContent}
    </Box>
  );
}
