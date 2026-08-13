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
