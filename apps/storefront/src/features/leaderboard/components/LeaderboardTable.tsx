import React from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import LeaderboardTableRow, {
  TABLE_GRID_COLS,
} from "@/features/leaderboard/components/LeaderboardTableRow";
import type { LeaderboardEntry } from "@/features/leaderboard/types/leaderboard.type";

const HEADER_COLS: { key: string; i18nKey: string; className?: string }[] = [
  { key: "no", i18nKey: "table.no" },
  { key: "player", i18nKey: "table.player" },
  { key: "totalTransaction", i18nKey: "table.totalTransaction", className: "text-right" },
];

interface Props {
  rows: LeaderboardEntry[];
}

export default function LeaderboardTable({ rows }: Props): React.JSX.Element {
  const { t } = useTranslation("leaderboard");

  return (
    <Box className="rounded-2xl overflow-hidden border border-white/8">
      {/* Header row */}
      <Box className={`grid ${TABLE_GRID_COLS} px-5 py-3.5 bg-[rgb(39,53,15)]`}>
        {HEADER_COLS.map((col) => (
          <Text
            key={col.key}
            as="span"
            className={`font-outfit font-semibold text-[13px] text-white leading-none ${col.className ?? ""}`}
          >
            {t(col.i18nKey)}
          </Text>
        ))}
      </Box>

      {/* Rows */}
      {rows.map((entry, index) => (
        <LeaderboardTableRow key={entry.rank} entry={entry} index={index} />
      ))}
    </Box>
  );
}
