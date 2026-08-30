import type { PaymentLifecycle, ProviderLifecycle, UnifiedTransaction } from "@/types/transaction.type";

/**
 * Human wording for the two lifecycles a transaction row now carries.
 *
 * The Transaksi table used to render `status` verbatim, so a merchant read
 * "FAILED_PROVIDER" and "PROCESSING" straight off the wire. Everything a person
 * sees in those two columns comes from here.
 */

const PAYMENT_LABELS: Record<PaymentLifecycle, string> = {
  PENDING: "Menunggu Bayar",
  SUCCESS: "Lunas",
  EXPIRED: "Kedaluwarsa",
  REFUNDED: "Dikembalikan",
  CANCELLED: "Dibatalkan",
};

/**
 * The merchant sees four outcomes; kita sees all eight.
 *
 * The extra five describe OUR fulfilment mechanics — which queue an order sits
 * in, whether we still hold the supplier's id for it. A merchant reading "Belum
 * Terkonfirmasi" learns nothing they can act on and opens a ticket; kita has to
 * see it, because that is exactly the row someone must chase by hand.
 */
const PROVIDER_LABELS: Record<"merchant" | "internal", Record<ProviderLifecycle, string>> = {
  merchant: {
    NOT_ORDERED: "Belum Diproses",
    QUEUED: "Diproses",
    SENDING: "Diproses",
    ORDERED: "Diproses",
    UNCONFIRMED: "Diproses",
    DELIVERED: "Berhasil",
    REJECTED: "Gagal",
    UNDELIVERED: "Gagal",
  },
  internal: {
    NOT_ORDERED: "Belum Dipesan",
    QUEUED: "Antre",
    SENDING: "Mengirim",
    ORDERED: "Diproses Supplier",
    UNCONFIRMED: "Belum Terkonfirmasi",
    DELIVERED: "Berhasil",
    REJECTED: "Ditolak Supplier",
    UNDELIVERED: "Tidak Terkirim",
  },
};

/** Em dash: nothing to say, as opposed to a state we failed to translate. */
const NOTHING = "—";

export function paymentLabel(status: PaymentLifecycle | null | undefined): string {
  return status ? (PAYMENT_LABELS[status] ?? NOTHING) : NOTHING;
}

export function providerLabel(
  status: ProviderLifecycle | null | undefined,
  audience: "merchant" | "internal",
): string {
  return status ? (PROVIDER_LABELS[audience][status] ?? NOTHING) : NOTHING;
}

/**
 * What the row's own `status` implies about payment, for an API that has not
 * shipped the split yet. The three repos deploy independently, so this page has
 * to stay correct in the window where only one of them has.
 *
 * `FAILED_PROVIDER` maps to SUCCESS on purpose: the customer's money was taken.
 * The supplier is the half that failed, and that is the other column's job to say.
 */
const LEGACY_PAYMENT: Record<string, PaymentLifecycle> = {
  COMPLETED: "SUCCESS",
  PAID: "SUCCESS",
  FAILED_PROVIDER: "SUCCESS",
  PENDING: "PENDING",
  PROCESSING: "PENDING",
  UNPAID: "PENDING",
  WAITING_CONFIRMATION: "PENDING",
  EXPIRED: "EXPIRED",
  REFUNDED: "REFUNDED",
  CANCELLED: "CANCELLED",
  REJECTED: "CANCELLED",
};

/**
 * The supplier verdict implied by the row's own status.
 *
 * Only top-up statuses appear here. A service-invoice status resolves to null:
 * a bill has no supplier behind it, and forcing one into this vocabulary would
 * invent a fact.
 */
const LEGACY_PROVIDER: Record<string, ProviderLifecycle> = {
  PENDING: "NOT_ORDERED",
  EXPIRED: "NOT_ORDERED",
  PAID: "QUEUED",
  PROCESSING: "ORDERED",
  COMPLETED: "DELIVERED",
  FAILED_PROVIDER: "REJECTED",
  REFUNDED: "UNDELIVERED",
};

type StatusSource = Pick<UnifiedTransaction, "status"> &
  Partial<Pick<UnifiedTransaction, "type" | "payment_status" | "provider_status">>;

export function resolvePaymentStatus(row: StatusSource): PaymentLifecycle | null {
  return row.payment_status ?? LEGACY_PAYMENT[row.status] ?? null;
}

export function resolveProviderStatus(row: StatusSource): ProviderLifecycle | null {
  if (row.provider_status) return row.provider_status;

  // A service bill has no supplier, and its vocabulary overlaps the top-up one
  // ("PAID" means "the bill is settled" here, not "paid, awaiting fulfilment"),
  // so the row's own type is the only safe discriminator.
  if (row.type === "service") return null;

  return LEGACY_PROVIDER[row.status] ?? null;
}
