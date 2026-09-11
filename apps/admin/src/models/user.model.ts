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
  /** The language this account reads the platform in — "id" or "en". */
  locale: string;
  timezone: string;
  email_verified_at: string | null;
  /**
   * True once the account has enrolled an authenticator.
   *
   * This is the only field that answers that question. `two_factor_confirmed_at`
   * used to be declared here too and was what the setup page actually read —
   * but `UserResource` has never emitted it, so the check was permanently
   * false and an enrolled admin was offered a "Start setup" that could only
   * 409. It is gone so the mistake cannot be made twice.
   */
  two_factor_enabled?: boolean;
  /** True for roles that must enrol before the panel opens (admins). */
  two_factor_required?: boolean;
  /** An authenticator move that was started but never confirmed. */
  two_factor_pending?: boolean;
  created_at: string;
  updated_at: string;
}
