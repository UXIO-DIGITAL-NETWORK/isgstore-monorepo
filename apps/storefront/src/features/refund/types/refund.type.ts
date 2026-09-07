export type RefundClaimStatus =
  | "WAITING_ACCOUNT"
  | "WAITING_DETAILS"
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "REJECTED";

export type RefundClaimMethod = "balance" | "balance_claim" | "manual_transfer" | "legacy_gateway";

/** `GET /v1/refund-claims/{token}` — the public claim projection. */
export interface RefundClaimModel {
  refund_number: string;
  invoice_number: string | null;
  product: string | null;
  amount: number;
  status: RefundClaimStatus;
  /**
   * `balance_claim` asks for an account, `manual_transfer` asks for a bank
   * account. Both flags below are decided by the API rather than derived from
   * this — the method is here so the page can word itself correctly.
   */
  method: RefundClaimMethod;
  /** Whether the payout form should still be shown — decided by the API, not re-derived here. */
  can_submit_payout: boolean;
  /** Whether the register/sign-in form should be shown. `balance_claim` only. */
  can_claim_account: boolean;
  /** Set once claimed: when the credit is promised by (2x24 working hours). */
  verify_due_at: string | null;
  /** Masked on the server: enough to recognise, useless to someone who intercepted the link. */
  contact: { email: string | null; phone: string | null };
  payout: {
    bank_code: string;
    bank_name: string | null;
    account_number: string | null;
    account_name: string | null;
    submitted_at: string | null;
  } | null;
  refunded_at: string | null;
  created_at: string | null;
}

/** `GET /v1/payout-banks` — served by the API so it cannot drift from what it accepts. */
export interface PayoutBank {
  code: string;
  name: string | null;
  is_ewallet: boolean;
}

export interface RegisterAndClaimPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
}

/**
 * `POST /v1/refund-claims/{token}/register` — the account and the claim in one
 * response. The token pair is here because the endpoint signs the new customer
 * in, exactly as the ordinary signup does.
 */
export interface ClaimAccountResult {
  access_token: string;
  refresh_token: string;
  user: import("@/types/models/user.model").User;
  refund: RefundClaimModel;
}

export interface PayoutDetailsPayload {
  bank_code: string;
  account_number?: string;
  account_name: string;
  account_phone?: string;
}
