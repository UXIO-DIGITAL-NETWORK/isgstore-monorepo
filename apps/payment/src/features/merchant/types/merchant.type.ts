export interface MerchantDashboard {
  saldo_aktif: number;
  saldo_pending: number;
  total_penjualan: number;
  total_penarikan: number;
  total_transaksi: number;
}

export interface MerchantTransaction {
  id: number;
  invoice_number: string;
  product: string | null;
  nett: number;
  status: string;
  payment_channel: string | null;
  created_at: string;
}

export interface MerchantMutation {
  id: number;
  type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  reference: string | null;
  description: string | null;
  created_at: string;
}

export type { Withdrawal, WithdrawalStatus, CreateWithdrawalPayload } from "@/types/withdrawal.type";
