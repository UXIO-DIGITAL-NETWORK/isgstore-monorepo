/**
 * Category Provider (product_requirements.md §4.5 lines 239-251, §6 line 286)
 * — confirmed 2026-07-14, the fifth and last tab of this feature.
 *
 * Maps which upstream supplier fulfils which category, and which of that
 * supplier's own categories the SKUs come from. `provider_name` holds the same supplier names used in §4.2
 * (Financial) and §4.4 (Integration); `category_id` references this same
 * feature's own Category records.
 *
 * **No `status` field** — none of the five reference images shows a Status
 * column or a Deactivate/Activate row item, and §6 line 286 confirms it. Same
 * as CategoryServer, unlike CategoryType.
 */
export interface CategoryProvider {
  id: string;
  /** Display name of the supplier, for the list. */
  provider_name: string;
  /** The API's foreign key — what the form's Provider select actually submits. */
  supplier_id: string;
  category_id: string;
  /**
   * The provider's own free-text `kategori` string (e.g. "Mobile Legends").
   * This is what decides which upstream SKUs are offered for the category —
   * it is not an order-form template, despite the column's old name.
   */
  provider_category: string;
  created_at: string;
  updated_at: string;
}

export interface CategoryProviderListParams {
  search?: string;
  /** Backs the toolbar's "Type to search provider" select (§4.5 line 241). */
  provider_name?: string;
  page?: number;
  per_page?: number;
}
