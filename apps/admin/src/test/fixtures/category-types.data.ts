import type { CategoryType } from "@/features/categories/types/categoryType.type";

/**
 * The set of types a Category can be classified as. Values mirror the
 * hardcoded `CATEGORY_TYPE_OPTIONS` in `select-options.data.ts`, which the
 * Add Category form's "Category Type" select still consumes — once the real
 * API lands that constant should be fed from this service instead.
 *
 * Deliberately *not* the reference's own rows: it shows "Mobile Legends" and
 * "Pc Games", but Mobile Legends is a specific game — a Category, not a
 * category *type* — so reproducing it would contradict §6 and break the
 * Category form's type filter. "PC Game" is kept.
 *
 * Ids and timestamps are literals, not generated: the contract test depends
 * on the fixtures being deterministic. Covers both voucher states and both
 * statuses so the Voucher and Status columns each have something to show.
 */
export const CATEGORY_TYPES: CategoryType[] = [
  {
    id: "ctype-1",
    name: "Mobile Game",
    is_voucher: false,
    status: "active",
    created_at: "2026-03-02T08:15:00Z",
    updated_at: "2026-06-20T09:15:00Z",
  },
  {
    id: "ctype-2",
    name: "PC Game",
    is_voucher: false,
    status: "active",
    created_at: "2026-03-05T10:40:00Z",
    updated_at: "2026-06-18T11:40:00Z",
  },
  {
    id: "ctype-3",
    name: "Voucher",
    is_voucher: true,
    status: "active",
    created_at: "2026-03-11T14:22:00Z",
    updated_at: "2026-06-22T14:05:00Z",
  },
  {
    id: "ctype-4",
    name: "Direct Top Up",
    is_voucher: false,
    status: "inactive",
    created_at: "2026-04-08T16:03:00Z",
    updated_at: "2026-06-15T10:00:00Z",
  },
];
