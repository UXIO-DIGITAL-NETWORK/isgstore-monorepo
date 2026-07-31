import logoGopay from "@/assets/images/checkout/logo_gopay.png";
import logoDana from "@/assets/images/checkout/logo_dana.png";
import logoOvo from "@/assets/images/checkout/logo_ovo.png";
import logoBca from "@/assets/images/checkout/logo_bca.png";
import logoMandiri from "@/assets/images/checkout/logo_mandiri.png";
import logoBri from "@/assets/images/checkout/logo_bri.png";
import logoBni from "@/assets/images/checkout/logo_bni.png";
import logoQris from "@/assets/images/checkout/logo_qris.png";
import iconCredit from "@/assets/images/checkout/icon_credit.png";

/**
 * Brand artwork for a payment channel, keyed by the API's `channel_code`.
 *
 * Logos stay bundled with the frontend rather than served from the API: they
 * are brand assets sized for this design, not admin-managed content, and
 * shipping them locally means no extra request and no broken-image state.
 *
 * Matching is substring-based because `channel_code` carries gateway-specific
 * prefixes and suffixes (`va_bca`, `bca_va`, `BCA_SIT`), and a new channel for
 * a bank already listed here should light up without a code change.
 */
const LOGO_BY_KEYWORD: ReadonlyArray<readonly [string, string]> = [
  ["gopay", logoGopay],
  ["dana", logoDana],
  ["ovo", logoOvo],
  ["bca", logoBca],
  ["mandiri", logoMandiri],
  ["bri", logoBri],
  ["bni", logoBni],
  ["qris", logoQris],
  ["balance", iconCredit],
] as const;

/** Generic fallback so an unrecognised channel still renders a chip. */
export const FALLBACK_PAYMENT_LOGO = iconCredit;

export const MEMBER_CREDITS_LOGO = iconCredit;

export function resolvePaymentLogo(channelCode: string): string {
  const code = channelCode.toLowerCase();
  const match = LOGO_BY_KEYWORD.find(([keyword]) => code.includes(keyword));

  return match?.[1] ?? FALLBACK_PAYMENT_LOGO;
}
