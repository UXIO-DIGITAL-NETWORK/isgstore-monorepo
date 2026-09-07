import React from "react";
import { useTranslation } from "react-i18next";
import { cva } from "class-variance-authority";
import { CalendarDays, Calendar, CalendarRange } from "lucide-react";
import { Box } from "@/components/common/Box";
import { cn } from "@/lib/utils";
import type { LeaderboardPeriod } from "@/features/leaderboard/types/leaderboard.type";

const tabVariants = cva(
  "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-outfit whitespace-nowrap cursor-pointer select-none outline-none transition-colors",
  {
    variants: {
      active: {
        true: "bg-[#9333EA] text-white font-semibold",
        false:
          "bg-white/[0.06] border border-white/10 text-white/60 hover:bg-white/10 hover:text-white/90",
      },
    },
    defaultVariants: { active: false },
  }
);

const PERIOD_ICONS: Record<LeaderboardPeriod, React.ReactNode> = {
  today: <CalendarDays size={15} />,
  week: <CalendarRange size={15} />,
  month: <Calendar size={15} />,
};

const PERIODS: LeaderboardPeriod[] = ["today", "week", "month"];

interface Props {
  period: LeaderboardPeriod;
  onPeriodChange: (p: LeaderboardPeriod) => void;
}

export default function LeaderboardPeriodTabs({
  period,
  onPeriodChange,
}: Props): React.JSX.Element {
  const { t } = useTranslation("leaderboard");

  return (
    <Box className="flex items-center justify-center gap-3 overflow-x-auto no-scrollbar pb-1">
      {PERIODS.map((p) => (
        <Box
          key={p}
          as="button"
          type="button"
          onClick={() => onPeriodChange(p)}
          className={cn(tabVariants({ active: period === p }))}
        >
          {PERIOD_ICONS[p]}
          {t(`periods.${p}`)}
        </Box>
      ))}
    </Box>
  );
}
