import type { Review, ReviewSummary } from "@/features/checkout/types/checkout.type";

export const REVIEW_SUMMARY_MOCK: ReviewSummary = {
  average: 4.6,
  total: 2847,
  breakdown: [
    { stars: 5, count: 2100, percentage: 74 },
    { stars: 4, count: 540,  percentage: 19 },
    { stars: 3, count: 142,  percentage: 5  },
    { stars: 2, count: 43,   percentage: 2  },
    { stars: 1, count: 22,   percentage: 1  },
  ],
};

export const REVIEWS_MOCK: Review[] = [
  {
    id: "r1",
    author: "rizk****_ml",
    rating: 5,
    comment: "Proses cepat, langsung masuk dalam hitungan detik.",
    date: "2026-05-05",
    maskedUserId: "1234****",
    product: "245 + 30 Diamonds",
  },
  {
    id: "r2",
    author: "rizk****_ml",
    rating: 5,
    comment: "Proses cepat, langsung masuk dalam hitungan detik.",
    date: "2026-05-05",
    maskedUserId: "5678****",
    product: "245 + 30 Diamonds",
  },
  {
    id: "r3",
    author: "rizk****_ml",
    rating: 5,
    comment: "Proses cepat, langsung masuk dalam hitungan detik.",
    date: "2026-05-05",
    maskedUserId: "9012****",
    product: "245 + 30 Diamonds",
  },
  {
    id: "r4",
    author: "rizk****_ml",
    rating: 5,
    comment: "Proses cepat, langsung masuk dalam hitungan detik.",
    date: "2026-05-05",
    maskedUserId: "3456****",
    product: "245 + 30 Diamonds",
  },
  {
    id: "r5",
    author: "rizk****_ml",
    rating: 5,
    comment: "Proses cepat, langsung masuk dalam hitungan detik.",
    date: "2026-05-05",
    maskedUserId: "7890****",
    product: "245 + 30 Diamonds",
  },
];
