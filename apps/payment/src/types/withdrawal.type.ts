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
  status: WithdrawalStatus;
  notes: string | null;
  approved_at: string | null;
  disbursement_ref: string | null;
  created_at: string;
  merchant?: { id: number; name: string; email: string };
}

export interface CreateWithdrawalPayload {
  amount: number;
  bank_code: string;
  account_number: string;
  account_name: string;
  notes?: string;
}
