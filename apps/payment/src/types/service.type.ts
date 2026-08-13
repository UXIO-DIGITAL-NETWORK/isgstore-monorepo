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
  price: number;
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
  transfer_instruction?: TransferInstruction;
  service?: { id: number; code: string; name: string };
  /** Present only in the internal view, which eager-loads it. */
  merchant?: { id: number; name: string; email: string };
  service_name: string;
  amount: number;
  duration_days: number;
  status: string;
  due_at: string | null;
  notes: string | null;
  proof_url: string | null;
  proof_uploaded_at: string | null;
  verified_at: string | null;
  /** Present once kita has confirmed payment; the installation hangs off it. */
  subscription?: { id: number; starts_at: string; ends_at: string; status: string } | null;
  created_at: string;
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
  "code" | "name" | "category" | "price" | "duration_days" | "is_active"
> & {
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

export interface TransferInstruction {
  bank_name: string;
  account_number: string;
  account_holder: string;
  note: string;
}
