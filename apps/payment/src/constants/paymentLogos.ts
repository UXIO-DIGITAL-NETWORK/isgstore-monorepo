import logoGopay from "@/assets/images/checkout/logo_gopay.png";
import logoDana from "@/assets/images/checkout/logo_dana.png";
import logoOvo from "@/assets/images/checkout/logo_ovo.png";
import logoShopeepay from "@/assets/images/checkout/logo_shopeepay.png";
import logoLinkaja from "@/assets/images/checkout/logo_linkaja.png";
import logoBca from "@/assets/images/checkout/logo_bca.png";
import logoMandiri from "@/assets/images/checkout/logo_mandiri.png";
import logoBri from "@/assets/images/checkout/logo_bri.png";
import logoBni from "@/assets/images/checkout/logo_bni.png";
import logoPermata from "@/assets/images/checkout/logo_permata.png";
import logoCimb from "@/assets/images/checkout/logo_cimb.png";
import logoDanamon from "@/assets/images/checkout/logo_danamon.png";
import logoSampoerna from "@/assets/images/checkout/logo_sampoerna.png";
import logoQris from "@/assets/images/checkout/logo_qris.png";
import iconCredit from "@/assets/images/checkout/icon_credit.png";

/**
 * Brand artwork for a payment channel, keyed by the API's `channel_code`.
 *
 * The same set the storefront ships, and bundled for the same reasons: they are
 * brand assets sized for this design rather than admin-managed content, so a
 * local import means no extra request and no broken-image state on the one page
 * a client has to trust.
 *
 * Matching is substring-based because `channel_code` carries gateway-specific
 * prefixes and suffixes (`va_bca`, `bca_va`, `BCA_SIT`), so a new channel for a
 * bank already listed here lights up without a code change.
 *
 * Order matters: the first keyword the code contains wins, so any keyword that
 * is a substring of another channel's code must come first — `danamon` before
 * `dana`, otherwise `danamon_va` would resolve to the DANA e-wallet logo.
 */
const LOGO_BY_KEYWORD: ReadonlyArray<readonly [string, string]> = [
  ["gopay", logoGopay],
  ["shopeepay", logoShopeepay],
  ["linkaja", logoLinkaja],
  ["danamon", logoDanamon],
  ["dana", logoDana],
  ["ovo", logoOvo],
  ["bca", logoBca],
  ["mandiri", logoMandiri],
  ["bri", logoBri],
  ["bni", logoBni],
  ["permata", logoPermata],
  ["cimb", logoCimb],
  ["bss", logoSampoerna],
  ["sampoerna", logoSampoerna],
  ["qris", logoQris],
  ["balance", iconCredit],
] as const;

/** Generic fallback so an unrecognised channel still renders a tile. */
export const FALLBACK_PAYMENT_LOGO = iconCredit;

export function resolvePaymentLogo(channelCode: string): string {
  const code = channelCode.toLowerCase();
  const match = LOGO_BY_KEYWORD.find(([keyword]) => code.includes(keyword));

  return match?.[1] ?? FALLBACK_PAYMENT_LOGO;
}
