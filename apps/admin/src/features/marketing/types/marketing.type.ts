/** Promo and flash-sale entities, mirroring the API's snake_case rows. */

export type PromoType = "percentage" | "fixed";
export type PromoScope = "global" | "category" | "product";

export interface Promo {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: PromoType;
  value: number;
  max_discount?: number;
  min_purchase: number;
  scope: PromoScope;
  scope_id?: string;
  quota_total?: number;
  quota_per_user?: number;
  used_count: number;
  starts_at?: string;
  ends_at?: string;
  /** Whether the storefront may advertise this code. */
  is_public: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FlashSaleItem {
  id: string;
  product_id: string;
  product_name: string;
  sale_price: number;
  original_price: number;
  stock_total: number;
  stock_sold: number;
  stock_available: number;
  sort_order: number;
}

export interface FlashSale {
  id: string;
  name: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  /** Active *and* inside its window — `is_active` alone does not say that. */
  is_running: boolean;
  items: FlashSaleItem[];
  created_at: string;
  updated_at: string;
}

export interface MarketingListParams {
  search?: string;
  page?: number;
  per_page?: number;
}
