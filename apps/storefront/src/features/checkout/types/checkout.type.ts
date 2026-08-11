import type { PaymentInstructions, TransactionStatus } from "@/types/models/transaction.model";

/**
 * A package group.
 *
 * Was a fixed union of four hardcoded groups; it is now the sub-category name
 * the API returns, because which groups exist is a per-game data decision
 * (a voucher game has no "Weekly Diamonds Pass"). `"all"` stays reserved for
 * the leading tab. Known keys still resolve their existing translations —
 * see `PackageCategoryTabs` — so nothing that was translated stops being so.
 */
export type PackageCategory = string;

export const ALL_CATEGORY: PackageCategory = "all";

export interface DiamondPackage {
  id: string;
  name: string;
  amount: number;
  price: number;
  category: PackageCategory;
  isPopular?: boolean;
  isBonus?: boolean;
  bonus?: number;
  bonusVariant?: 1 | 2 | 3;
  /** Numeric product id sent to the checkout endpoint. */
  productId: number;
}

export interface CategoryTab {
  key: PackageCategory;
  label: string;
}

export interface PaymentOption {
  id: string;
  name: string;
  logo: string;
  /** Numeric payment_channel_id sent to the checkout endpoint. */
  channelId: number;
  minAmount: number;
  feeFlat: number;
  feePercent: number;
}

export interface MemberCredits {
  id: string;
  balance: number;
  logo: string;
  channelId: number;
}

export type PaymentGroupType = "ewallet" | "qris" | "va" | "retail" | "link";

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
  email: string;
}

// ── API payloads ───────────────────────────────────────────────────────────

export interface ValidateGameIdResult {
  nickname: string | null;
  validated: boolean;
  /** False when the game has no lookup provider configured at all. */
  supported: boolean;
}

export interface GameReviewsResponse {
  summary: ReviewSummary;
  reviews: {
    data: {
      id: number;
      author: string;
      rating: number;
      comment: string | null;
      masked_user_id: string | null;
      product: string | null;
      created_at: string;
    }[];
  };
}

export interface CheckoutPayload {
  product_id: number;
  payment_channel_id: number;
  target_uid: string;
  target_server?: string;
  target_nickname?: string;
  guest_contact?: string;
  /** Where the purchase receipt is sent; required, and a tracking key later. */
  email: string;
  /** Storefront language, used to localise the receipt email (id | en). */
  locale?: string;
  /** Re-validated server-side — the client's quoted discount is never trusted. */
  promo_code?: string;
}

export interface CheckoutResult {
  invoice_number: string;
  reference_id: string;
  product: { name: string; price: number };
  payment: {
    channel: string;
    type: string;
    amount: number;
    admin_fee: number; // combined total (back-compat)
    channel_fee: number; // "Biaya Metode Pembayaran"
    admin_markup: number; // "Biaya Admin"
    status: TransactionStatus;
    instructions: PaymentInstructions | null;
  };
}
