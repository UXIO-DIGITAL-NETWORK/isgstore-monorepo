export interface MerchantDashboard {
  saldo_aktif: number;
  saldo_pending: number;
  total_penjualan: number;
  total_penarikan: number;
  total_transaksi: number;
  /** Nearest subscription expiry; null when nothing is subscribed. */
  service_active_until: string | null;
  active_services_count: number;
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

// ── Services the client buys from kita ───────────────────────────────────────

export type {
  Service,
  ServiceCategoryValue,
  ServiceInvoice,
  ServiceSubscription,
} from "@/types/service.type";

export type ComponentStatus = "operational" | "degraded" | "down" | "closed";

export interface ServiceStatusComponent {
  type: "service" | "payment_channel";
  id: number;
  name: string;
  status: ComponentStatus;
}

export interface ServiceStatusIncident {
  id: number;
  title: string;
  target: { type: "service" | "payment_channel"; id: number; name: string | null };
  severity: string;
  status: string;
  message: string;
  started_at: string;
  estimated_resolved_at: string | null;
}

export interface ServiceStatusResponse {
  overall: ComponentStatus;
  incidents: ServiceStatusIncident[];
  components: ServiceStatusComponent[];
}
