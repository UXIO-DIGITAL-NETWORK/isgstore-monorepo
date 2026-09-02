// Confirmed against the real staging login response — see
// product_requirements.md §6. balance/point/locale are shared with the
// consumer platform's user model, not admin concepts: typed for accuracy,
// no admin UI is built around them.
export interface User {
  id: number;
  role_id: number;
  name: string;
  email: string;
  phone: string;
  balance: number;
  point: number;
  locale: string;
  timezone: string;
  email_verified_at: string | null;
  /** Set once the account has enrolled an authenticator. */
  two_factor_confirmed_at?: string | null;
  two_factor_enabled?: boolean;
  /** True for roles that must enrol before the panel opens (admins). */
  two_factor_required?: boolean;
  created_at: string;
  updated_at: string;
}
