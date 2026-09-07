import React from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import type { ReviewSummary } from "@/features/checkout/types/checkout.type";

interface Props {
  summary: ReviewSummary;
}

export default function RatingSummary({ summary }: Props): React.JSX.Element {
  const { t } = useTranslation("checkout");

  const satisfiedCount = summary.breakdown
    .filter((b) => b.stars >= 4)
    .reduce((acc, b) => acc + b.count, 0);
  const satisfactionRate = summary.total > 0
    ? Math.round((satisfiedCount / summary.total) * 100)
    : 0;

  const maxCount = Math.max(...summary.breakdown.map((b) => b.count), 1);

  return (
    <Box className="flex flex-col gap-3">
      {/* Score row — centered */}
      <Box className="flex flex-col items-center gap-1.5">
        <Box className="flex items-center gap-2">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#FBBF24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
          <Box className="flex items-baseline gap-1">
            <Text as="span" className="font-plex font-bold text-[36px] text-white leading-none tabular-nums">
              {summary.average.toFixed(1)}
            </Text>
            <Text as="span" className="font-plex text-[16px] text-white/40 leading-none tabular-nums">
              / 5.0
            </Text>
          </Box>
        </Box>
        <Text as="span" className="font-inter text-[11px] text-white/40 leading-snug text-center">
          {t("reviews.satisfactionText", { rate: satisfactionRate })}
        </Text>
        <Text as="span" className="font-inter text-[11px] text-white/30 leading-none text-center">
          {t("reviews.fromCount", { count: summary.total.toLocaleString() })}
        </Text>
      </Box>

      {/* Breakdown bars */}
      <Box className="flex flex-col gap-1.5">
        {[...summary.breakdown].sort((a, b) => b.stars - a.stars).map(({ stars, count }) => (
          <Box key={stars} className="flex items-center gap-2">
            <Text as="span" className="font-plex tabular-nums text-[11px] text-white/50 leading-none w-3 text-right shrink-0">
              {stars}
            </Text>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="#FBBF24" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
            <Box className="flex-1 h-[7px] rounded-full bg-[#0B051D]">
              <Box
                className="h-full rounded-full bg-[#FBBF24]"
                style={{ width: `${(count / maxCount) * 100}%` }}
              />
            </Box>
            <Text as="span" className="font-plex tabular-nums text-[11px] text-white/40 leading-none w-7 text-right shrink-0">
              {count.toLocaleString()}
            </Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
