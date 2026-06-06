import React from "react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import type { Review } from "@/features/checkout/types/checkout.type";

interface Props {
  review: Review;
}

function StarFilled(): React.JSX.Element {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="#FBBF24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
    </svg>
  );
}

function StarEmpty(): React.JSX.Element {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="1.5" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ReviewItem({ review }: Props): React.JSX.Element {
  return (
    <Box className="flex gap-3 py-3 border-b border-white/6 last:border-0">
      {/* Avatar */}
      <Box className="w-8 h-8 rounded-full bg-linear-to-br from-[#3B82F6] to-[#9234EA] flex items-center justify-center shrink-0">
        <Text as="span" className="font-outfit font-bold text-[13px] text-white leading-none">
          {review.author.charAt(0).toUpperCase()}
        </Text>
      </Box>

      {/* Content */}
      <Box className="flex-1 min-w-0">
        <Box className="flex items-center justify-between gap-2 mb-0.5">
          <Text as="span" className="font-inter font-semibold text-[12px] text-white leading-none truncate">
            {review.author}
          </Text>
          {review.maskedUserId && (
            <Text as="span" className="font-plex tabular-nums text-[10px] text-white/30 leading-none shrink-0">
              ID: {review.maskedUserId}
            </Text>
          )}
        </Box>

        {/* Stars + date row */}
        <Box className="flex items-center gap-2 mb-1.5">
          <Box className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) =>
              s <= review.rating ? <StarFilled key={s} /> : <StarEmpty key={s} />
            )}
          </Box>
          <Text as="span" className="font-inter text-[10px] text-white/30 leading-none">
            {new Date(review.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
          </Text>
        </Box>

        <Text as="p" className="font-inter text-[12px] text-white/60 leading-relaxed">
          {review.comment}
        </Text>
      </Box>
    </Box>
  );
}
