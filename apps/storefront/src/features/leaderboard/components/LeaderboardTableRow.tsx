import React from "react";
import { User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import type { LeaderboardEntry } from "@/features/leaderboard/types/leaderboard.type";

export const TABLE_GRID_COLS = "grid-cols-[0.6fr_3fr_1.6fr]";

interface Props {
  entry: LeaderboardEntry;
  index: number;
}

export default function LeaderboardTableRow({ entry, index }: Props): React.JSX.Element {
  const { i18n } = useTranslation();
  const locale = i18n.language;
  const isEven = index % 2 === 0;

  return (
    <Box
      className={cn(
        `grid ${TABLE_GRID_COLS} items-center w-full px-5 py-3.5`,
        "border-b border-white/5 last:border-0",
        isEven ? "bg-transparent" : "bg-[#0D0718]/40"
      )}
    >
      {/* Rank number */}
      <Text as="span" className="font-plex text-[13px] text-white/40 leading-none">
        #{entry.rank}
      </Text>

      {/* Player cell: avatar + name */}
      <Box className="flex items-center gap-2.5 min-w-0">
        <Box className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 border border-white/10 shrink-0">
          <User size={14} className="text-white/50" />
        </Box>
        <Text as="span" className="font-inter text-[13px] text-white/85 leading-none truncate">
          {entry.playerName}
        </Text>
      </Box>

      {/* Total amount */}
      <Text as="span" className="font-plex text-[13px] text-white/80 leading-none text-right">
        {formatCurrency(entry.totalAmount, locale)}
      </Text>
    </Box>
  );
}
