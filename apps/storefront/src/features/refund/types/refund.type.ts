/** `GET /v1/refund-claims/{token}` — the public claim projection. */
export interface RefundClaimModel {
  refund_number: string;
  invoice_number: string | null;
  product: string | null;
  amount: number;
  status: "WAITING_DETAILS" | "PENDING" | "PROCESSING" | "COMPLETED" | "REJECTED";
  /** Whether the payout form should still be shown — decided by the API, not re-derived here. */
  can_submit_payout: boolean;
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

export interface PayoutDetailsPayload {
  bank_code: string;
  account_number?: string;
  account_name: string;
  account_phone?: string;
}
