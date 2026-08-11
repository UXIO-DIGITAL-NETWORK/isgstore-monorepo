export type { Withdrawal } from "@/types/withdrawal.type";

export interface FinanceDashboard {
  saldo: number;
  total_markup: number;
  total_gateway_fee: number;
  total_settled_to_merchants: number;
  pending_withdrawals: number;
  pending_withdrawals_amount: number;
}

export interface FinanceMerchant {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  balance: number;
  created_at: string;
}

export interface FinanceTransaction {
  id: number;
  invoice_number: string;
  product: string | null;
  merchant: { id: number; name: string } | null;
  amount_base: number;
  amount_fee: number;
  amount_total: number;
  gateway_fee: number;
  platform_profit: number;
  margin: number;
  status: string;
  payment_channel: string | null;
  created_at: string;
}
