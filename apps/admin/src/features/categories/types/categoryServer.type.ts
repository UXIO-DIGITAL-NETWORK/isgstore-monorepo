/**
 * CategoryServer entity per product_requirements.md §4.5/§6 (confirmed
 * 2026-07-14, renamed from "Server Category"). Feature-local and provisional
 * until the real API contract lands — see system_architecture.md §6.
 *
 * Note this is the only entity in the feature with **no `status` field** —
 * a category server has no active/inactive concept, which is also why its
 * row menu has no deactivate item and its list has no Status column.
 */
export interface CategoryServerOption {
  name: string;
  value: string;
}

export interface CategoryServer {
  id: string;
  /** Parent Category. Required by the API — a server always belongs to a game. */
  category_id: string;
  name: string;
  /** The add form's "+ Add Option" repeatable Name/Value pair list. */
  options: CategoryServerOption[];
  created_at: string;
  updated_at: string;
}

export interface CategoryServerListParams {
  search?: string;
  category_id?: string;
  page?: number;
  per_page?: number;
}
