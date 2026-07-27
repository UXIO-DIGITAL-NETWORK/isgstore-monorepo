import type { CategoryStatus } from "./category.type";

/**
 * SubCategory entity per product_requirements.md §4.5/§6 (confirmed
 * 2026-07-14). Feature-local and provisional until the real API contract
 * lands — see system_architecture.md §6.
 *
 * `currency_name` is the reference table's mislabeled second "Name" column
 * (e.g. "Diamonds") — two columns cannot both be "Name"; §4.5 line 208
 * renames it to what it actually holds.
 */
export interface SubCategory {
  id: string;
  /** Parent Category reference. */
  category_id: string;
  name: string;
  currency_name: string;
  logo_url?: string;
  description?: string;
  status: CategoryStatus;
  created_at: string;
  updated_at: string;
}

export interface SubCategoryListParams {
  search?: string;
  category_id?: string;
  page?: number;
  per_page?: number;
}
