export interface MembershipPlan {
  id: string;
  /** Plain text, localised by the API — plan copy is admin-editable data, not
   * a translation key baked into the bundle. */
  name: string;
  price: number;
  benefits: string[];
  /** `null` = lifetime, never expires. */
  durationDays: number | null;
  popular?: boolean;
}

/** Extended PaymentOption that includes an optional admin fee per method. */
export interface PaymentOption {
  id: string;
  name: string;
  logo: string;
  fee?: number;
}

export type PaymentGroupType = "ewallet" | "va" | "qris";

export interface PaymentGroup {
  type: PaymentGroupType;
  label: string;
  options: PaymentOption[];
}

export interface MemberCreditsInfo {
  balance: number;
}
