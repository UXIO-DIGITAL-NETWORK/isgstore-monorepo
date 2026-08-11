/**
 * `App\Enums\TransactionStatus` — the exact uppercase strings the API stores
 * and returns. Never compare against lowercase variants.
 */
export type TransactionStatus =
  | "PENDING"
  | "PAID"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED_PROVIDER"
  | "EXPIRED"
  | "REFUNDED";

/**
 * Statuses after which nothing more will change, so invoice polling stops.
 * Kept in sync with `ShowInvoiceAction::TERMINAL_STATUSES`.
 */
export const TERMINAL_TRANSACTION_STATUSES: readonly TransactionStatus[] = [
  "COMPLETED",
  "FAILED_PROVIDER",
  "EXPIRED",
  "REFUNDED",
] as const;

export type PaymentType =
  | "virtual_account"
  | "qris"
  | "ewallet"
  | "convenience_store"
  | "payment_link";

/**
 * Instructions the customer pays against, persisted at checkout so a page
 * refresh still renders them. Which fields are present depends on the channel.
 */
export interface PaymentInstructions {
  order_no?: string;
  qr_string?: string;
  virtual_account?: string;
  bank_code?: string;
  checkout_url?: string;
  is_single_use?: boolean;
}

/** `GET /v1/invoices/{invoice_number}`. */
export interface InvoiceModel {
  invoice_number: string;
  status: TransactionStatus;
  /** True once the status can no longer change — the poll should stop. */
  is_terminal: boolean;
  game: {
    name: string;
    slug: string;
    region: string | null;
    logo_url: string | null;
    thumbnail_url: string | null;
  } | null;
  product: { name: string | null };
  target: {
    uid: string | null;
    server: string | null;
    nickname: string | null;
  };
  amount: { base: number; fee: number; channel_fee: number; admin_fee: number; total: number };
  payment: {
    channel: string | null;
    channel_code: string | null;
    type: PaymentType | null;
    reference_id: string | null;
    status: string | null;
    paid_at: string | null;
    instructions: PaymentInstructions | null;
  };
  /** Drives the countdown; null when the channel has no configured window. */
  expires_at: string | null;
  /** Voucher / serial number, present once the supplier has fulfilled. */
  sn: string | null;
  created_at: string;
}

/** A row from `GET /v1/me/transactions` or `GET /v1/orders/track`. */
export interface TransactionSummaryModel {
  id?: number;
  invoice_number: string;
  service_name?: string | null;
  service_detail?: string | null;
  service?: string | null;
  target?: string;
  target_nickname?: string | null;
  amount: number;
  /** Fee breakdown (present on member/track lists); optional for older shapes. */
  base?: number;
  channel_fee?: number;
  admin_fee?: number;
  status: TransactionStatus;
  payment_method?: PaymentType | null;
  payment_channel?: string | null;
  game_id?: number | null;
  game_name?: string | null;
  game_slug?: string | null;
  game_logo_url?: string | null;
  sn?: string | null;
  created_at: string;
}
