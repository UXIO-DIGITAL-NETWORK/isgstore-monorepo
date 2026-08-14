/**
 * Category entity per product_requirements.md §4.5/§6 (promoted from
 * roadmap 2026-07-11). Feature-local and provisional until the real API
 * contract lands — see system_architecture.md §6.
 */
export type CategoryStatus = "active" | "inactive";

/** One buyer-facing input field the consumer top-up site shows on the order
 * form for this category (e.g. `user_id`, `server_id`). Direct but
 * not-yet-wired relationship to the consumer storefront — see §4.5. */
export interface CategoryOrderFormField {
  key: string;
  label?: string;
  required?: boolean;
}

export interface Category {
  id: string;
  /** The category-type id — what the form's Type select and `type_id` write use. */
  type_id: string;
  /** The category-type display name — what the list column shows. */
  type: string;
  uid_parser: string;
  name: string;
  sub_name?: string;
  account_nickname_validation?: string;
  region?: string;
  code: string;
  slug: string;
  status: CategoryStatus;
  order_form_fields: CategoryOrderFormField[];
  // Media & description + SEO (§4.5, added 2026-07-11). All optional/provisional.
  logo_url?: string;
  description?: string;
  meta_title?: string;
  meta_description?: string;
  og_image_url?: string;
  meta_keywords?: string[];
  meta_robots?: string;
  created_at: string;
  updated_at: string;
}

export interface CategoryListParams {
  search?: string;
  type?: string;
  page?: number;
  per_page?: number;
}

/** Small typed option shape for the form's selects. */
export interface SelectOption {
  value: string;
  label: string;
}
