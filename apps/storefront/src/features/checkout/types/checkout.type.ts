export type PackageCategory = "all" | "weekly" | "monthly" | "special";

export interface DiamondPackage {
  id: string;
  name: string;
  amount: number;
  price: number;
  category: PackageCategory;
  isPopular?: boolean;
  isBonus?: boolean;
}

export interface PaymentOption {
  id: string;
  name: string;
  logo: string;
}

export type PaymentGroupType = "ewallet" | "qris" | "va";

export interface PaymentGroup {
  type: PaymentGroupType;
  label: string;
  options: PaymentOption[];
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
  maskedUserId?: string;
  product?: string;
}

export interface ReviewSummary {
  average: number;
  total: number;
  breakdown: { stars: number; count: number; percentage: number }[];
}

export interface GameInfo {
  name: string;
  publisher: string;
  region: string;
  slug: string;
  logo: string;
  thumbnail: string;
}

export interface CheckoutSelectionState {
  selectedPackageId: string | null;
  selectedPaymentId: string | null;
  activeCategory: PackageCategory;
  userId: string;
  serverId: string;
  whatsapp: string;
}
