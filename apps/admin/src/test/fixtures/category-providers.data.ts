import type { CategoryProvider } from "@/features/categories/types/categoryProvider.type";

/**
 * Ids and timestamps are literals, not generated: the contract test depends on
 * the fixtures being deterministic.
 *
 * `provider_name` reuses the supplier names already fixtured in
 * `features/financial/data/suppliers.data.ts` and
 * `features/integration/data/channels.data.ts` (§4.5 line 239). They are
 * mirrored rather than imported — feature isolation forbids reaching across
 * features, and `integration.type.ts` states the overlap is deliberately not
 * a shared type.
 *
 * `category_id` points at real rows in `categories.data.ts`. The reference's
 * Category column reads "Mobile Legends Indonesia", which is not a Category
 * that exists — `cat-1` "Mobile Legends" is the real record it maps to.
 */
export const CATEGORY_PROVIDERS: CategoryProvider[] = [
  {
    id: "cprov-1",
    provider_name: "Uxiotopup",
    supplier_id: "1",
    category_id: "cat-1",
    provider_template: "Games-Mobile Legends",
    created_at: "2026-03-08T07:32:00Z",
    updated_at: "2026-06-20T09:15:00Z",
  },
  {
    id: "cprov-2",
    provider_name: "Zelpoint",
    supplier_id: "1",
    category_id: "cat-2",
    provider_template: "Free Fire Indonesia",
    created_at: "2026-03-10T21:58:00Z",
    updated_at: "2026-06-18T11:40:00Z",
  },
  {
    id: "cprov-3",
    provider_name: "Topupkuy",
    supplier_id: "1",
    category_id: "cat-3",
    provider_template: "Games-Genshin Impact",
    created_at: "2026-03-18T09:05:00Z",
    updated_at: "2026-06-22T14:05:00Z",
  },
  {
    id: "cprov-4",
    provider_name: "Zelpoint",
    supplier_id: "1",
    category_id: "cat-4",
    provider_template: "Games-PUBG Mobile",
    created_at: "2026-04-02T13:20:00Z",
    updated_at: "2026-06-10T08:30:00Z",
  },
  {
    id: "cprov-5",
    provider_name: "Topupkuy",
    supplier_id: "1",
    category_id: "cat-6",
    provider_template: "Voucher-Steam Wallet",
    created_at: "2026-04-11T16:47:00Z",
    updated_at: "2026-06-05T16:20:00Z",
  },
];
