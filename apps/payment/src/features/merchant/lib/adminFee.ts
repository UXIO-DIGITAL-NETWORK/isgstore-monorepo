import type { ServicePaymentChannel } from "@/types/service.type";

/**
 * What a payment method adds to a bill.
 *
 * Mirrors `OpenServiceInvoicePaymentAction` so the total moves as the client
 * compares methods. The server recomputes it on submit and *its* figure is the
 * one charged — this exists to show a number before that round trip, not to
 * decide one.
 */
export function adminFeeFor(channel: ServicePaymentChannel | null, amount: number): number {
  if (!channel) return 0;

  return channel.fee_flat + Math.round(amount * (channel.fee_percent / 100));
}
