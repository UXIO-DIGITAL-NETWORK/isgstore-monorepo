export interface MembershipPlan {
  id: string;
  nameKey: string;
  price: number;
  benefitKeys: string[];
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
