import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import SectionCard from "@/features/checkout/components/SectionCard";
import RatingSummary from "./fragments/RatingSummary";
import ReviewItem from "./fragments/ReviewItem";
import { REVIEW_SUMMARY_MOCK, REVIEWS_MOCK } from "@/features/checkout/data/reviews.mock";

const INITIAL_VISIBLE = 3;

export default function CustomerReviews(): React.JSX.Element {
  const { t } = useTranslation("checkout");
  const [showAll, setShowAll] = useState(false);

  const visibleReviews = showAll ? REVIEWS_MOCK : REVIEWS_MOCK.slice(0, INITIAL_VISIBLE);

  return (
    <SectionCard
      title={t("reviews.title")}
      headerRight={
        <Text as="span" className="font-inter text-[11px] text-white/35 leading-none tabular-nums font-plex">
          {t("reviews.basedOn", { count: REVIEW_SUMMARY_MOCK.total.toLocaleString() })}
        </Text>
      }
    >
      <Box className="flex flex-col gap-4">
        {/* Summary */}
        <RatingSummary summary={REVIEW_SUMMARY_MOCK} />

        {/* Divider */}
        <Box className="h-px bg-white/6" />

        {/* Review list */}
        <Box className="flex flex-col">
          {visibleReviews.map((review) => (
            <ReviewItem key={review.id} review={review} />
          ))}
        </Box>

        {/* See all toggle */}
        {REVIEWS_MOCK.length > INITIAL_VISIBLE && (
          <Box
            as="button"
            type="button"
            onClick={() => setShowAll((prev) => !prev)}
            className="w-full py-2 rounded-lg border border-white/8 bg-white/[0.02] hover:bg-white/[0.05] transition-colors cursor-pointer outline-none"
          >
            <Text as="span" className="font-outfit font-medium text-[12px] text-white/55 leading-none">
              {showAll ? "Sembunyikan" : t("reviews.seeAll")}
            </Text>
          </Box>
        )}
      </Box>
    </SectionCard>
  );
}
