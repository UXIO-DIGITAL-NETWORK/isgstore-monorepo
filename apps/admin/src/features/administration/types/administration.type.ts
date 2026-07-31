/** Payment channels, users and settings — the operational back office. */

export interface PaymentChannel {
  id: string;
  payment_type: string;
  channel_code: string;
  name: string;
  logo_url?: string;
  description?: string;
  min_amount: number;
  fee_flat: number;
  fee_percent: number;
  sort_order: number;
  is_active: boolean;
  is_single_use: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  role_id: string;
  role?: string;
  name: string;
  username?: string;
  email: string;
  phone: string;
  avatar_url?: string;
  balance: number;
  point: number;
  locale: string;
  email_verified_at?: string;
  created_at: string;
}

export interface Setting {
  id: string;
  group: string;
  key: string;
  value: string | null;
  type: "string" | "text" | "number" | "boolean" | "json" | "image";
  label?: string;
  /** Whether the storefront's public settings endpoint returns this key. */
  is_public: boolean;
}

export interface AdministrationListParams {
  search?: string;
  role_id?: string;
  payment_type?: string;
  page?: number;
  per_page?: number;
}
