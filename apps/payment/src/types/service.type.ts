/**
 * The services kita sells to its payment-page clients, plus the billing and
 * status shapes around them. Shared: the internal slice manages these and the
 * client slice consumes them, so they live here rather than in either feature
 * (same reason as withdrawal.type.ts).
 */

export type ServiceCategoryValue =
  | "payment-gateway"
  | "supplier"
  | "communication"
  | "infrastructure"
  | "other";

export interface Service {
  id: number;
  code: string;
  name: string;
  category: ServiceCategoryValue;
  category_label: string;
  description: string | null;
  features: string[];
  /** What kita bills a client for ONE period, in whole rupiah. */
  selling_price: number;
  /**
   * What the service costs kita for ONE period. Internal only — the merchant
   * endpoints serve the same resource with this key omitted, so it is optional
   * on purpose: the type stops a client-facing screen from reading it.
   */
  cost_price?: number;
  /** Length of ONE subscription period, in days. */
  duration_days: number;
  payment_channel?: { id: number; name: string } | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ServiceInvoice {
  id: number;
  invoice_number: string;
  service?: { id: number; code: string; name: string };
  /** Present only in the internal view, which eager-loads it. */
  merchant?: { id: number; name: string; email: string };
  service_name: string;
  amount: number;
  duration_days: number;
  status: string;
  due_at: string | null;
  notes: string | null;
  /** The gateway attempt the client is looking at; null until one is opened. */
  payment?: ServiceInvoicePayment | null;
  verified_at: string | null;
  /** Present once kita has confirmed payment; the installation hangs off it. */
  subscription?: { id: number; starts_at: string; ends_at: string; status: string } | null;
  /** `hub_plan` = issued on the Hub's schedule, not raised by the client. */
  source?: "local" | "hub_plan";
  /** Settled with kita outside the gateway and recorded by an operator. */
  settled_offline?: boolean;
  period_starts_at?: string | null;
  period_ends_at?: string | null;
  created_at: string;
}

/**
 * One line of "what I am subscribed to, and what I must renew".
 *
 * Distinct from ServiceSubscription: that row only exists once a period has
 * been PAID for, so the very thing a client needs to see — a period nobody has
 * paid yet — is the one thing missing from it.
 */
export interface ServicePlanLine {
  service_code: string;
  service_name: string;
  /**
   * billed   — a recurring period.
   * one_time — a setup fee: one bill, and paying it opens no subscription.
   * prepaid  — settled outside the system (never shown as outstanding).
   */
  billing_mode: "billed" | "one_time" | "prepaid";
  amount: number;
  duration_days: number;
  /** The one line whose lapse takes the storefront down. */
  governs_licence: boolean;
  is_active: boolean;
  /** Paid up to. Null when nothing has been paid for yet. */
  active_until: string | null;
  next_period_starts_at: string | null;
  next_due_at: string | null;
  outstanding_total: number;
  outstanding: {
    id: number;
    invoice_number: string;
    amount: number;
    due_at: string | null;
    period_starts_at: string | null;
    period_ends_at: string | null;
  }[];
}

/** One Monetapay attempt and every bill it covers. */
export interface ServiceBatchPayment {
  reference_id: string;
  channel: string | null;
  channel_code: string | null;
  type: string | null;
  amount: number;
  admin_fee: number;
  total: number;
  invoice_count: number;
  status: "PENDING" | "PAID" | "EXPIRED";
  expires_at: string | null;
  is_expired: boolean;
  instructions: ServiceInvoicePayment["instructions"];
  invoices: {
    id: number;
    invoice_number: string;
    service_name: string;
    status: string;
    amount: number;
    admin_fee: number;
  }[];
}

export interface ServiceSubscription {
  id: number;
  service?: { id: number; code: string; name: string; category: ServiceCategoryValue };
  merchant?: { id: number; name: string };
  starts_at: string;
  ends_at: string;
  days_remaining: number;
  status: string;
  invoice_number?: string | null;
  created_at: string;
}

export type IncidentTarget = {
  type: "service" | "payment_channel";
  id: number;
  name: string | null;
};

export interface ServiceIncident {
  id: number;
  title: string;
  target: IncidentTarget;
  severity: string;
  status: string;
  message: string;
  started_at: string;
  estimated_resolved_at: string | null;
  resolved_at: string | null;
  created_at: string;
}

/** Body of POST/PUT /incidents — exactly one target key is sent. */
export interface IncidentPayload {
  title: string;
  service_id?: number | null;
  payment_channel_id?: number | null;
  severity: string;
  status: string;
  message: string;
  started_at: string;
  estimated_resolved_at?: string | null;
}

/** Body of POST/PUT /services. `sort_order` defaults server-side when omitted. */
export type ServicePayload = Pick<
  Service,
  "code" | "name" | "category" | "selling_price" | "duration_days" | "is_active"
> & {
  cost_price: number;
  description?: string | null;
  features?: string[];
  payment_channel_id?: number | null;
  sort_order?: number;
};

// ── Installation: schedule, milestone checklist, handed-over credentials ─────

export interface ServiceInstallationStep {
  id: number;
  title: string;
  description: string | null;
  sort_order: number;
  is_completed: boolean;
  completed_at: string | null;
  completed_by?: string | null;
}

export interface ServiceInstallationDetail {
  id: number;
  label: string;
  /** Always null for a secret — plaintext arrives only via the reveal call. */
  value: string | null;
  masked_value: string;
  is_secret: boolean;
  sort_order: number;
}

export type InstallationStatus = "NOT_STARTED" | "IN_PROGRESS" | "DONE";

export interface ServiceInstallation {
  id: number;
  service?: { id: number; code: string; name: string };
  merchant?: { id: number; name: string };
  starts_at: string | null;
  ends_at: string | null;
  notes: string | null;
  steps_total: number;
  steps_completed: number;
  /** Derived server-side from the checklist; never a stored claim. */
  progress_percent: number;
  status: InstallationStatus;
  steps: ServiceInstallationStep[];
  details: ServiceInstallationDetail[];
}

export interface InstallationPayload {
  starts_at?: string | null;
  ends_at?: string | null;
  notes?: string | null;
}

export interface InstallationStepPayload {
  title: string;
  description?: string | null;
  sort_order?: number;
}

export interface InstallationDetailPayload {
  label: string;
  /** Omit on update to keep the stored value — that is how a label is renamed
   *  without the secret round-tripping through the browser. */
  value?: string;
  is_secret?: boolean;
  sort_order?: number;
}

/** The catalogue entry as the checkout page needs it. */
export interface ServiceCheckout extends Service {
  current_period_ends_at: string | null;
  /** Server-computed, mirroring the renewal-stacking rule. */
  projected_starts_at: string;
  projected_ends_at: string;
  has_open_invoice: boolean;
  open_invoice_id: number | null;
}

/**
 * One Monetapay attempt against a bill.
 *
 * Which keys `instructions` carries depends on the method — a QRIS answers with
 * a payload to render, a virtual account with a number, an e-wallet with a link
 * — so the card branches on presence rather than on `type`.
 */
export interface ServiceInvoicePayment {
  channel: string | null;
  channel_code: string | null;
  type: string | null;
  /** THIS bill's own share of the attempt, never the batch's figures. */
  amount: number;
  admin_fee: number;
  total: number;
  /**
   * Set only when the attempt covered several bills. The client paid
   * `batch.total` once; `amount`/`admin_fee` above are this bill's slice of it.
   */
  batch?: {
    reference_id: string;
    invoice_count: number;
    amount: number;
    admin_fee: number;
    total: number;
  } | null;
  status: "PENDING" | "PAID" | "EXPIRED";
  /** Server-declared; never re-derived on the client. */
  expires_at: string | null;
  is_expired: boolean;
  instructions: {
    order_no?: string;
    qr_string?: string;
    virtual_account?: string;
    bank_code?: string;
    redirect_url?: string;
    deeplink_url?: string;
  } | null;
}

/** A method a client may settle a service bill with. */
export interface ServicePaymentChannel {
  id: number;
  payment_type: string;
  channel_code: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  min_amount: number;
  fee_flat: number;
  fee_percent: number;
  sort_order: number;
}

/**
 * Which id an installation is reached by. Both resolve to the same
 * (merchant, service) row on the server — the operator reaches it from a
 * confirmed subscription, or from an invoice they are about to confirm.
 *
 * The read query is keyed on this rather than on the installation id, because
 * before the first save the endpoint returns null and there is no id to key on.
 */
export type InstallationScope = { by: "subscription" | "invoice"; id: number };
