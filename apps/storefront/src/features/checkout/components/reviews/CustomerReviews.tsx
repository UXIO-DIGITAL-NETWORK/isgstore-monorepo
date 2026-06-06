import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import SectionCard from "@/features/checkout/components/SectionCard";
import RatingSummary from "./fragments/RatingSummary";
import ReviewItem from "./fragments/ReviewItem";
import { REVIEW_SUMMARY_MOCK, REVIEWS_MOCK } from "@/features/checkout/data/reviews.mock";

const INITIAL_VISIBLE = 5;

function StarHeaderIcon(): React.JSX.Element {
  return (
    <Box className="w-7 h-7 rounded-lg bg-[rgba(251,191,36,0.12)] border border-[rgba(251,191,36,0.25)] flex items-center justify-center shrink-0">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="#FBBF24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
      </svg>
    </Box>
  );
}

export default function CustomerReviews(): React.JSX.Element {
  const { t } = useTranslation("checkout");
  const [showAll, setShowAll] = useState(false);

  const visibleReviews = showAll ? REVIEWS_MOCK : REVIEWS_MOCK.slice(0, INITIAL_VISIBLE);

  return (
    <SectionCard
      title={t("reviews.title")}
      icon={<StarHeaderIcon />}
      gradientBorder
    >
      <Box className="flex flex-col gap-4">
        {/* Rating summary */}
        <RatingSummary summary={REVIEW_SUMMARY_MOCK} />

        {/* Divider */}
        <Box className="h-px bg-white/6" />

        {/* Review cards */}
        <Box className="flex flex-col gap-2">
          {visibleReviews.map((review) => (
            <ReviewItem key={review.id} review={review} />
          ))}
        </Box>

        {/* See all button */}
        <Box
          as="button"
          type="button"
          onClick={() => setShowAll((prev) => !prev)}
          className="w-full py-3.5 rounded-full border border-[rgba(147,51,234,0.55)] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(147,51,234,0.08)] active:bg-[rgba(147,51,234,0.12)] transition-colors cursor-pointer outline-none flex items-center justify-center gap-2"
        >
          <Text
            as="span"
            className="font-outfit font-semibold text-[12px] uppercase tracking-[1px] leading-none text-[#9234EA]"
          >
            {showAll ? t("reviews.hide") : t("reviews.seeAll")}
          </Text>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d={showAll ? "M15 18L9 12L15 6" : "M9 18L15 12L9 6"}
              stroke="#9234EA"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Box>
      </Box>
    </SectionCard>
  );
}
