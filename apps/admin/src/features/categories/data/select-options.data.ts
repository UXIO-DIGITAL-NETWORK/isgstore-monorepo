import type { SelectOption } from "../types/category.type";

export const CATEGORY_TYPE_OPTIONS: SelectOption[] = [
  { value: "Mobile Game", label: "Mobile Game" },
  { value: "PC Game", label: "PC Game" },
  { value: "Voucher", label: "Voucher" },
];

export const REGION_OPTIONS: SelectOption[] = [
  { value: "Southeast Asia", label: "Southeast Asia" },
  { value: "Global", label: "Global" },
];

/**
 * Category Provider's `Provider` select (§4.5 line 247). Mirrors the supplier
 * names in `features/financial/data/suppliers.data.ts` and the `type:
 * "supplier"` entries of `features/integration/data/channels.data.ts` — copied
 * rather than imported, because features must not reach across each other and
 * `integration.type.ts` states the overlap is deliberately not a shared type.
 */
export const PROVIDER_OPTIONS: SelectOption[] = [
  { value: "Uxiotopup", label: "Uxiotopup" },
  { value: "Zelpoint", label: "Zelpoint" },
  { value: "Topupkuy", label: "Topupkuy" },
];

/**
 * **Invented — not confirmed anywhere.** `provider_template` has no defined
 * value set in the PRD or any reference; §4.5 only names the field. Seeded
 * with the two values visible in the reference's table, extended to cover the
 * other fixtured categories. Replace once the real integration templates land.
 */
export const PROVIDER_TEMPLATE_OPTIONS: SelectOption[] = [
  { value: "Games-Mobile Legends", label: "Games-Mobile Legends" },
  { value: "Free Fire Indonesia", label: "Free Fire Indonesia" },
  { value: "Games-Genshin Impact", label: "Games-Genshin Impact" },
  { value: "Games-PUBG Mobile", label: "Games-PUBG Mobile" },
  { value: "Games-Valorant", label: "Games-Valorant" },
  { value: "Voucher-Steam Wallet", label: "Voucher-Steam Wallet" },
];

export const META_ROBOTS_OPTIONS: SelectOption[] = [
  { value: "Index, Follow", label: "Index, Follow" },
  { value: "No Index, No Follow", label: "No Index, No Follow" },
  { value: "Index, No Follow", label: "Index, No Follow" },
  { value: "No Index, Follow", label: "No Index, Follow" },
];
