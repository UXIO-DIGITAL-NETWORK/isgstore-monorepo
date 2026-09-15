import React from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { formatDate } from "@/lib/format";
import type { Review } from "@/features/checkout/types/checkout.type";

interface Props {
  review: Review;
}

function StarFilled(): React.JSX.Element {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="#FBBF24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
    </svg>
  );
}

function StarEmpty(): React.JSX.Element {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="1.5" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ReviewItem({ review }: Props): React.JSX.Element {
  const { i18n } = useTranslation();

  // Through the shared formatter, so the review's date follows the page locale
  // and the platform's WIB clock like every other date on the storefront. It
  // used to hardcode en-GB and the visitor's own zone, which made one card in a
  // review list disagree with the rest of the page.
  const formattedDate = formatDate(review.date, i18n.language);

  return (
    <Box className="rounded-xl border border-white/8 bg-white/[0.025] p-3 flex flex-col gap-1.5">
      {/* Row 1: username + stars */}
      <Box className="flex items-center justify-between gap-2">
        <Text as="span" className="font-inter font-semibold text-[12px] text-white leading-none truncate">
          {review.author}
        </Text>
        <Box className="flex items-center gap-0.5 shrink-0">
          {[1, 2, 3, 4, 5].map((s) =>
            s <= review.rating ? <StarFilled key={s} /> : <StarEmpty key={s} />
          )}
        </Box>
      </Box>

      {/* Row 2: product + date */}
      <Box className="flex items-center justify-between gap-2">
        {review.product && (
          <Text as="span" className="font-inter text-[11px] text-white/35 leading-none truncate">
            {review.product}
          </Text>
        )}
        <Text as="span" className="font-inter text-[10px] text-white/30 leading-none shrink-0 ml-auto">
          {formattedDate}
        </Text>
      </Box>

      {/* Comment */}
      <Text as="p" className="font-inter text-[12px] text-white/60 leading-relaxed">
        {review.comment}
      </Text>
    </Box>
  );
}
