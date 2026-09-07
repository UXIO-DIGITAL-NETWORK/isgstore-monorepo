import type { CategoryStatus } from "./category.type";

/**
 * CategoryType entity per product_requirements.md §4.5/§6 (confirmed
 * 2026-07-14). Feature-local and provisional until the real API contract
 * lands — see system_architecture.md §6.
 *
 * `status` reuses the feature's `active | inactive` union. The reference's
 * own screenshots disagree with themselves here — one shows "Active", another
 * "In Process" for the same rows — but "In Process" is the shadcn demo
 * dataset's review-workflow vocabulary, already discarded when the Category
 * tab was built, and the row menu's "Deactive" action confirms the real model.
 */
export interface CategoryType {
  id: string;
  name: string;
  /** Set by the add form's "This category type is for vouchers" checkbox;
   * drives the list's Voucher column. */
  is_voucher: boolean;
  status: CategoryStatus;
  created_at: string;
  updated_at: string;
}

export interface CategoryTypeListParams {
  search?: string;
  page?: number;
  per_page?: number;
}
