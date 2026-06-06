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
    author: "Budi S.",
    rating: 5,
    comment: "Prosesnya cepat banget! Diamond langsung masuk dalam hitungan detik. Recommended!",
    date: "2026-05-28",
    maskedUserId: "1234****",
  },
  {
    id: "r2",
    author: "Rina K.",
    rating: 5,
    comment: "Udah langganan di sini dari lama, belum pernah kecewa. Harga terjangkau dan aman.",
    date: "2026-05-25",
    maskedUserId: "5678****",
  },
  {
    id: "r3",
    author: "Ahmad F.",
    rating: 4,
    comment: "Top up berhasil, tapi sempat nunggu sekitar 5 menit. Overall masih oke lah.",
    date: "2026-05-20",
    maskedUserId: "9012****",
  },
  {
    id: "r4",
    author: "Sari D.",
    rating: 5,
    comment: "Gampang banget, tinggal masukin ID terus pilih paket. Langsung masuk tanpa ribet!",
    date: "2026-05-18",
    maskedUserId: "3456****",
  },
  {
    id: "r5",
    author: "Doni P.",
    rating: 4,
    comment: "Sudah 3x top up, selalu berhasil. Metode pembayarannya juga lengkap.",
    date: "2026-05-15",
    maskedUserId: "7890****",
  },
];
