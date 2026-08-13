export type { Withdrawal } from "@/types/withdrawal.type";

export interface FinanceDashboard {
  saldo: number;
  total_admin_fee: number;
  total_gateway_fee: number;
  total_settled_to_merchants: number;
  pending_withdrawals: number;
  pending_withdrawals_amount: number;
}

export interface ChannelFee {
  id: number;
  name: string;
  channel_code: string;
  payment_type: string;
  min_amount: number;
  fee_flat: number;
  fee_percent: number;
  is_active: boolean;
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
  /** "Biaya Admin" — the payment method's fee. */
  admin_fee: number;
  amount_total: number;
  gateway_fee: number;
  platform_profit: number;
  status: string;
  payment_channel: string | null;
  created_at: string;
}

// Shared with the client slice — see src/types/service.type.ts.
export type {
  IncidentPayload,
  IncidentTarget,
  Service,
  ServiceCategoryValue,
  ServiceIncident,
  ServiceInvoice,
  ServicePayload,
  ServiceSubscription,
} from "@/types/service.type";
