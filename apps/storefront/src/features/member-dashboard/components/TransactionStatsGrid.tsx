import React from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import StatCard from "@/features/member-dashboard/components/StatCard";
import type { TransactionStat } from "@/features/member-dashboard/types/dashboard.type";

interface Props {
  stats: TransactionStat[];
}

export default function TransactionStatsGrid({ stats }: Props): React.JSX.Element {
  const { t } = useTranslation("dashboard");

  const statusStats = stats.filter((s) => s.tone !== "neutral");
  const wideStats = stats.filter((s) => s.tone === "neutral");

  return (
    <Box className="flex flex-col gap-3 mb-6">
      {/* Section title */}
      <Box
        as="h3"
        className="font-outfit font-bold text-[14px] text-white uppercase tracking-widest leading-none mb-1"
      >
        {t("stats.title")}
      </Box>

      {/* 4 status cards — 2×2 grid */}
      <Box className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statusStats.map((stat) => (
          <StatCard key={stat.key} stat={stat} />
        ))}
      </Box>

      {/* 2 wide summary cards */}
      <Box className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {wideStats.map((stat) => (
          <StatCard
            key={stat.key}
            stat={stat}
            isCurrency={stat.key === "sales"}
          />
        ))}
      </Box>
    </Box>
  );
}
