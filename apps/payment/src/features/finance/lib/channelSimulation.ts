/**
 * Illustrative economics of one payment channel at a chosen nominal — a preview
 * for the finance team, never persisted. Mirrors the server's fee math
 * (`CheckoutAction`: admin fee on the nominal, gateway cut on the gross) so the
 * numbers here line up with what the backend actually charges.
 *
 * Tax (PPN) is levied on the channel fee only — the fee is kita's revenue on the
 * transaction; net profit is that fee minus the gateway's cut minus the tax.
 */
export interface ChannelSimulationInput {
  fee_flat: number;
  fee_percent: number;
  gateway_fee_flat: number;
  gateway_fee_percent: number;
}

export interface ChannelSimulation {
  /** Biaya admin channel at this nominal (kita's gross revenue on the tx). */
  fee: number;
  /** Gateway (Monetapay) cut, taken on the gross = nominal + fee. */
  gatewayFee: number;
  /** PPN on the channel fee. */
  tax: number;
  /** Net profit: fee − gatewayFee − tax. */
  profit: number;
}

/** Non-finite/negative inputs collapse to 0 so an empty field shows 0, not NaN. */
const clamp = (n: number): number => (Number.isFinite(n) && n > 0 ? n : 0);

export function simulateChannel(
  ch: ChannelSimulationInput,
  amount: number,
  taxRatePercent: number,
): ChannelSimulation {
  const base = clamp(amount);
  const rate = clamp(taxRatePercent);

  const fee = ch.fee_flat + Math.round(base * (ch.fee_percent / 100));
  const gross = base + fee;
  const gatewayFee = ch.gateway_fee_flat + Math.round(gross * (ch.gateway_fee_percent / 100));
  const tax = Math.round(fee * (rate / 100));

  return { fee, gatewayFee, tax, profit: fee - gatewayFee - tax };
}
