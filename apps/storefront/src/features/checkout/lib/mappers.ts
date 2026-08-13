import { MEMBER_CREDITS_LOGO, resolvePaymentLogo } from "@/constants/paymentLogos";
import placeholderThumbnail from "@/assets/images/games/games_1.png";
import placeholderLogo from "@/assets/images/game_logo/mobile_legends.png";
import type { GameDetailModel } from "@/types/models/game.model";
import type { GameProductsResponse, PaymentChannelModel } from "@/types/models/product.model";
import type {
  CategoryTab,
  DiamondPackage,
  GameInfo,
  GameReviewsResponse,
  MemberCredits,
  PaymentGroup,
  PaymentGroupType,
  PaymentOption,
  Review,
} from "../types/checkout.type";

/**
 * Translates API payloads into the shapes the checkout components already
 * accept, so wiring up real data changes no markup.
 *
 * Fields the API has no column for (`bonus`, `bonusVariant`, `isPopular`) are
 * left undefined rather than invented — the cards already render their base
 * variant when those are absent, so the UI is unchanged rather than filled
 * with fiction.
 */

export function toGameInfo(game: GameDetailModel): GameInfo {
  return {
    name: game.name,
    // `sub_name` is where the admin stores the publisher ("Moonton").
    publisher: game.sub_name ?? "",
    region: game.region ?? "",
    slug: game.slug,
    // Bundled placeholders when a game has no artwork uploaded — the API
    // returns null rather than a URL that would render broken.
    logo: game.logo_url ?? placeholderLogo,
    thumbnail: game.thumbnail_url ?? placeholderThumbnail,
  };
}

export function toDiamondPackages(response: GameProductsResponse): DiamondPackage[] {
  return response.products.map((product) => ({
    id: String(product.id),
    productId: product.id,
    name: product.name,
    amount: product.amount ?? 0,
    price: product.price,
    category: product.group,
  }));
}

export function toCategoryTabs(response: GameProductsResponse): CategoryTab[] {
  return response.groups.map((group) => ({ key: group, label: group }));
}

/**
 * API `payment_type` → the group key the payment section renders.
 *
 * Only the three offered categories (VA / e-wallet / QRIS) are mapped — the
 * backend already omits everything else from the storefront list, and any
 * unmapped type is dropped by `toPaymentGroups`, so nothing else can render.
 */
const GROUP_BY_PAYMENT_TYPE: Partial<Record<PaymentChannelModel["payment_type"], PaymentGroupType>> = {
  ewallet: "ewallet",
  qris: "qris",
  virtual_account: "va",
};

/** Display order of the groups, matching the original mock ordering. */
const GROUP_ORDER: PaymentGroupType[] = ["ewallet", "va", "qris"];

export function toPaymentGroups(channels: PaymentChannelModel[]): PaymentGroup[] {
  const byGroup = new Map<PaymentGroupType, PaymentOption[]>();

  for (const channel of channels) {
    // The wallet gets its own card above the groups, not a chip inside one.
    if (channel.channel_code === "balance") continue;

    const group = GROUP_BY_PAYMENT_TYPE[channel.payment_type];
    if (!group) continue;

    const options = byGroup.get(group) ?? [];
    options.push({
      id: channel.channel_code,
      channelId: channel.id,
      name: channel.name,
      logo: resolvePaymentLogo(channel.channel_code),
      minAmount: channel.min_amount,
      feeFlat: channel.fee_flat,
      feePercent: channel.fee_percent,
    });
    byGroup.set(group, options);
  }

  return GROUP_ORDER.filter((group) => byGroup.has(group)).map((group) => ({
    type: group,
    // The section translates known group keys; this label is the fallback.
    label: group,
    options: byGroup.get(group) ?? [],
  }));
}

/** Null when the caller is a guest — the API omits `balance` for them. */
export function toMemberCredits(channels: PaymentChannelModel[]): MemberCredits | null {
  const wallet = channels.find((channel) => channel.channel_code === "balance");

  if (!wallet) return null;

  return {
    id: wallet.channel_code,
    channelId: wallet.id,
    balance: wallet.balance ?? 0,
    logo: MEMBER_CREDITS_LOGO,
  };
}

export function toReviews(response: GameReviewsResponse): Review[] {
  return response.reviews.data.map((review) => ({
    id: String(review.id),
    author: review.author,
    rating: review.rating,
    comment: review.comment ?? "",
    date: review.created_at,
    maskedUserId: review.masked_user_id ?? undefined,
    product: review.product ?? undefined,
  }));
}

/**
 * The admin fee ("Biaya Admin") — the payment method's flat + percent charge,
 * mirroring CheckoutAction's maths. There is no second global markup: the
 * channel's own fee is the whole fee the customer pays on top of the price.
 */
export function calculateAdminFee(option: Pick<PaymentOption, "feeFlat" | "feePercent">, price: number): number {
  const percent = Math.max(0, Math.min(100, option.feePercent));

  return option.feeFlat + Math.round((price * percent) / 100);
}
