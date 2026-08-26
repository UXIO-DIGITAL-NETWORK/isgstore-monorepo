export type WithdrawalStatus = "PENDING" | "APPROVED" | "PROCESSING" | "SETTLED" | "REJECTED" | "FAILED";

export interface Withdrawal {
  id: number;
  withdrawal_number: string;
  amount: number;
  fee: number;
  nett: number;
  bank_code: string;
  // Null for e-wallet payouts (keyed on the phone, not an account number).
  account_number: string | null;
  account_name: string;
  account_phone: string | null;
  status: WithdrawalStatus;
  notes: string | null;
  approved_at: string | null;
  disbursement_ref: string | null;
  // Populated when a Monetapay disbursement fails (mirrors the gateway's
  // error_msg). Shown to kita so a FAILED payout carries its reason.
  failure_reason: string | null;
  proof_url: string | null;
  created_at: string;
  // Present (possibly null) only on the finance ("payment-internal") list view,
  // which eager-loads it. Null for an internal withdrawal (merchant_id null).
  merchant?: { id: number; name: string; email: string } | null;
  // Present (possibly null) only on the finance list view. Set for an internal
  // ("penarikan internal") withdrawal — the kita user who created it; null for
  // a merchant-initiated one.
  requester?: { id: number; name: string; email: string } | null;
}

export interface CreateWithdrawalPayload {
  amount: number;
  bank_code: string;
  // Optional: e-wallet payouts have no account number.
  account_number?: string;
  account_name: string;
  // Monetapay requires the beneficiary's phone number (the wallet id for e-wallets).
  account_phone: string;
  notes?: string;
}

/** Same shape as CreateWithdrawalPayload — an internal withdrawal has no merchant to pick. */
export type CreateInternalWithdrawalPayload = CreateWithdrawalPayload;
