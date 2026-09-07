/** Roles seeded by the API. Guards compare against these, not against ids. */
export type UserRole = "admin" | "member" | "vip" | "reseller" | "agent";

/** Mirrors `App\Http\Resources\User\UserResource`. */
export interface User {
  id: number;
  role_id: number;
  /** Only present when the API eager-loaded the relation (login, register, /me). */
  role?: UserRole;
  name: string;
  username: string | null;
  avatar: string | null;
  avatar_url: string | null;
  email: string;
  phone: string | null;
  balance: number;
  point: number;
  locale: string;
  timezone: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}
