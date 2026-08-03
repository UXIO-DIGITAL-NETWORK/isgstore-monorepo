import type { SubCategory } from "@/features/categories/types/subCategory.type";

/**
 * Real game-related sub-taxonomy rows — never the shadcn demo dataset content
 * (Cover Page / Table of Contents / Jamik Tashpulatov / Eddie Lake), which is
 * what the reference's row-menu frame still showed.
 *
 * Every `category_id` resolves to a row in `categories.data.ts`. Ids and
 * timestamps are literals, not generated — the contract test depends on the
 * fixtures being deterministic.
 */
export const SUB_CATEGORIES: SubCategory[] = [
  {
    id: "sub-1",
    category_id: "cat-1",
    name: "Mobile Legends: Global",
    currency_name: "Diamonds",
    logo_url: "mobile-legends-global-logo.png",
    description: "Global server top-ups for Mobile Legends: Bang Bang.",
    status: "active",
    created_at: "2026-03-08T07:32:00Z",
    updated_at: "2026-06-20T09:15:00Z",
  },
  {
    id: "sub-2",
    category_id: "cat-2",
    name: "Free Fire: Indonesia",
    currency_name: "Diamonds",
    description: "Indonesian server top-ups for Free Fire.",
    status: "active",
    created_at: "2026-03-10T21:58:00Z",
    updated_at: "2026-06-18T11:40:00Z",
  },
  {
    id: "sub-3",
    category_id: "cat-3",
    name: "Genshin Impact: Asia",
    currency_name: "Genesis Crystals",
    status: "active",
    created_at: "2026-04-02T13:05:00Z",
    updated_at: "2026-06-22T14:05:00Z",
  },
  {
    id: "sub-4",
    category_id: "cat-5",
    name: "Valorant: Southeast Asia",
    currency_name: "Valorant Points",
    status: "inactive",
    created_at: "2026-04-19T09:47:00Z",
    updated_at: "2026-06-15T10:00:00Z",
  },
];
