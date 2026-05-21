export interface User {
  id: number;
  name: string;
  email: string;
  role: "member" | "superadmin";
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}
