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
  { value: "Uxiolabs", label: "Uxiolabs" },
  { value: "Zelpoint", label: "Zelpoint" },
  { value: "Topupkuy", label: "Topupkuy" },
];

export const META_ROBOTS_OPTIONS: SelectOption[] = [
  { value: "Index, Follow", label: "Index, Follow" },
  { value: "No Index, No Follow", label: "No Index, No Follow" },
  { value: "Index, No Follow", label: "Index, No Follow" },
  { value: "No Index, Follow", label: "No Index, Follow" },
];
