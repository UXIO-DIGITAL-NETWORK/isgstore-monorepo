export interface MerchantDashboard {
  saldo_aktif: number;
  saldo_pending: number;
  /** Earned but still inside the per-channel holding period (settlement T+n + fraud buffer). */
  saldo_tertahan: number;
  total_penjualan: number;
  total_penarikan: number;
  total_transaksi: number;
  /** Nearest subscription expiry; null when nothing is subscribed. */
  service_active_until: string | null;
  active_services_count: number;
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

// The Transaksi feed merges sales with service bills — see transaction.type.ts.
export type { UnifiedTransaction, TransactionDirection, TransactionType } from "@/types/transaction.type";

// ── Services the client buys from kita ───────────────────────────────────────

export type {
  Service,
  ServiceBatchPayment,
  ServiceCategoryValue,
  ServiceInvoice,
  ServicePlanLine,
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

/**
 * The Services page's tabs, in order. Lives here rather than in the route
 * because routes are registry-only and this is page vocabulary — the route just
 * validates `?tab` against it.
 *
 * `bills` sits SECOND, not first, deliberately: making it the landing tab would
 * move every existing client off the screen they know, to one that is empty
 * whenever nothing is due. The plan summary on "Langganan Saya" already shows an
 * outstanding total, so an overdue client sees it on arrival either way.
 */
export const SERVICES_TABS = ["subscriptions", "bills", "catalog", "invoices"] as const;

export type ServicesTab = (typeof SERVICES_TABS)[number];
