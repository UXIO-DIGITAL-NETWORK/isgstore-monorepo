// Confirmed against the real staging login response — see
// product_requirements.md §6. balance/point/locale are shared with the
// consumer platform's user model, not admin concepts: typed for accuracy,
// no admin UI is built around them.
export interface User {
  id: number;
  role_id: number;
  /**
   * Lower-cased role name from the API (e.g. "payment-internal", "payment-admin").
   * This — not role_id — drives which payment-page surface the user sees, since
   * role ids aren't stable across environments.
   */
  role?: string;
  name: string;
  email: string;
  phone: string;
  balance: number;
  point: number;
  locale: string;
  timezone: string;
  email_verified_at: string | null;
  /** Reserved for the planned 2FA phase — not in the real response yet. */
  two_factor_confirmed_at?: string | null;
  created_at: string;
  updated_at: string;
}
