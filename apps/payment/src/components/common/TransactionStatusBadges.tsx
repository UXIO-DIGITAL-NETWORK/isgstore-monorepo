import { StatusBadge } from "@/components/common/StatusBadge";
import { paymentLabel, providerLabel } from "@/lib/transactionStatus";
import type { PaymentLifecycle, ProviderLifecycle } from "@/types/transaction.type";

/**
 * The two lifecycle badges for the Transaksi table.
 *
 * They render through the shared StatusBadge so the tone system stays one
 * system, but they own the wording — the shared badge deliberately prints raw
 * status text for the dozen other pages that rely on it.
 */
export function PaymentStatusBadge({ status }: { status: PaymentLifecycle | null }) {
  return (
    <StatusBadge
      status={status ?? "NONE"}
      label={paymentLabel(status)}
    />
  );
}

export function ProviderStatusBadge({
  status,
  audience,
}: {
  status: ProviderLifecycle | null;
  audience: "merchant" | "internal";
}) {
  return (
    <StatusBadge
      status={status ?? "NONE"}
      label={providerLabel(status, audience)}
    />
  );
}
