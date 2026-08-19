export type WithdrawalStatus = "PENDING" | "APPROVED" | "PROCESSING" | "SETTLED" | "REJECTED" | "FAILED";

export interface Withdrawal {
  id: number;
  withdrawal_number: string;
  amount: number;
  fee: number;
  nett: number;
  bank_code: string;
  account_number: string;
  account_name: string;
  account_phone: string;
  status: WithdrawalStatus;
  notes: string | null;
  approved_at: string | null;
  disbursement_ref: string | null;
  // Populated when a Monetapay disbursement fails (mirrors the gateway's
  // error_msg). Shown to kita so a FAILED payout carries its reason.
  failure_reason: string | null;
  proof_url: string | null;
  created_at: string;
  merchant?: { id: number; name: string; email: string };
}

export interface CreateWithdrawalPayload {
  amount: number;
  bank_code: string;
  account_number: string;
  account_name: string;
  // Monetapay requires the beneficiary's phone number for a disbursement.
  account_phone: string;
  notes?: string;
}
