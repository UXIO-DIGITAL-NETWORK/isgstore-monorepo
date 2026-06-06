import React from "react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import type { ReviewSummary } from "@/features/checkout/types/checkout.type";

interface Props {
  summary: ReviewSummary;
}

function StarIcon({ filled }: { filled: boolean }): React.JSX.Element {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill={filled ? "#FBBF24" : "none"} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
        stroke="#FBBF24"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={filled ? "#FBBF24" : "none"}
      />
    </svg>
  );
}

export default function RatingSummary({ summary }: Props): React.JSX.Element {
  return (
    <Box className="flex gap-5">
      {/* Left: big number */}
      <Box className="flex flex-col items-center justify-center gap-1 shrink-0">
        <Text
          as="span"
          className="font-plex font-bold text-[40px] text-white leading-none tabular-nums"
        >
          {summary.average.toFixed(1)}
        </Text>
        <Box className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <StarIcon key={star} filled={star <= Math.round(summary.average)} />
          ))}
        </Box>
        <Text as="span" className="font-inter text-[11px] text-white/40 leading-none">
          {summary.total.toLocaleString()} ulasan
        </Text>
      </Box>

      {/* Right: breakdown bars */}
      <Box className="flex-1 flex flex-col justify-center gap-1.5">
        {summary.breakdown.map(({ stars, percentage }) => (
          <Box key={stars} className="flex items-center gap-2">
            <Text as="span" className="font-plex tabular-nums text-[11px] text-white/50 leading-none w-4 text-right shrink-0">
              {stars}
            </Text>
            <svg width="11" height="11" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
              <path
                d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                fill="#FBBF24"
                strokeLinejoin="round"
              />
            </svg>
            <Box className="flex-1 h-1.5 rounded-full bg-[#0B051D]">
              <Box
                className="h-full rounded-full bg-[#9333EA]"
                style={{ width: `${percentage}%` }}
              />
            </Box>
            <Text as="span" className="font-plex tabular-nums text-[10px] text-white/40 leading-none w-7 shrink-0">
              {percentage}%
            </Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
