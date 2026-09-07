export interface PaymentOption {
  id: string;
  name: string;
  logo: string;
}

export type PaymentGroupType = "ewallet" | "va" | "qris";

export interface PaymentGroup {
  type: PaymentGroupType;
  label: string;
  options: PaymentOption[];
}

export interface VoucherInfo {
  code: string;
  discountPercent: number;
}
