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
  /** The payment gateway's cut of each transaction; kita's profit is the admin fee net of this. */
  gateway_fee_percent: number;
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

// The Transaksi feed merges sales with service bills — see transaction.type.ts.
export type { FinanceUnifiedTransaction, UnifiedTransaction } from "@/types/transaction.type";

// Shared with the client slice — see src/types/service.type.ts.
export type {
  InstallationScope,
  InstallationDetailPayload,
  InstallationPayload,
  InstallationStepPayload,
  ServiceInstallation,
  ServiceInstallationDetail,
  ServiceInstallationStep,
  IncidentPayload,
  IncidentTarget,
  Service,
  ServiceCategoryValue,
  ServiceIncident,
  ServiceInvoice,
  ServicePayload,
  ServiceSubscription,
} from "@/types/service.type";
