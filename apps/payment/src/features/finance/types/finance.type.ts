export type { Withdrawal } from "@/types/withdrawal.type";

export interface FinanceDashboard {
  saldo: number;
  total_admin_fee: number;
  total_gateway_fee: number;
  total_settled_to_merchants: number;
  /** How many merchant-attributed transactions exist, all statuses. */
  total_transactions_count: number;
  /** Paid nominal (amount_base) those transactions represent. */
  total_transactions_amount: number;
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
  /** Flat (Rp) gateway fee for VA/retail channels. */
  gateway_fee_flat: number;
  /** Percent gateway fee for QRIS/e-wallet channels. */
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

/**
 * One in-app notification for the internal team. `type` is a coarse category
 * (`transaction_sale` | `service_payment` | `withdrawal_request` |
 * `subscription_expiring`) the bell/page use to pick an icon; `data` carries the
 * event's ids (invoice/withdrawal number, merchant id) for future deep-linking.
 */
export interface FinanceNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string | null;
}

export interface NotificationUnreadCount {
  unread_count: number;
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
