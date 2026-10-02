import type { CurrentMembershipModel, MembershipPlanModel } from "@/features/member-dashboard/services/membership.service";
import type { CheckoutResult } from "@/features/checkout/types/checkout.type";
import type { PriceListRow } from "@/services/storefront.service";
import type { InvoiceModel } from "@/types/models/transaction.model";
import type { PaymentChannelModel } from "@/types/models/product.model";

import { GAME_LOGO, GAME_THUMBNAILS } from "./assets";
import { MOCK_GAMES, MOCK_PRODUCTS } from "./games";

/** Every channel except `balance`, which is appended for signed-in members only. */
export const MOCK_PAYMENT_CHANNELS: PaymentChannelModel[] = [
  { id: 1, name: "GoPay", channel_code: "gopay", payment_type: "ewallet", fee_flat: 0, fee_percent: 0, min_amount: 1000, balance: null },
  { id: 2, name: "DANA", channel_code: "dana", payment_type: "ewallet", fee_flat: 0, fee_percent: 0, min_amount: 1000, balance: null },
  { id: 3, name: "OVO", channel_code: "ovo", payment_type: "ewallet", fee_flat: 0, fee_percent: 0, min_amount: 1000, balance: null },
  { id: 4, name: "ShopeePay", channel_code: "shopeepay", payment_type: "ewallet", fee_flat: 0, fee_percent: 0, min_amount: 1000, balance: null },
  { id: 5, name: "LinkAja", channel_code: "linkaja", payment_type: "ewallet", fee_flat: 0, fee_percent: 0, min_amount: 1000, balance: null },
  { id: 6, name: "BCA Virtual Account", channel_code: "bca_va", payment_type: "virtual_account", fee_flat: 4000, fee_percent: 0, min_amount: 10000, balance: null },
  { id: 7, name: "Mandiri Virtual Account", channel_code: "mandiri_va", payment_type: "virtual_account", fee_flat: 4000, fee_percent: 0, min_amount: 10000, balance: null },
  { id: 8, name: "BNI Virtual Account", channel_code: "bni_va", payment_type: "virtual_account", fee_flat: 4000, fee_percent: 0, min_amount: 10000, balance: null },
  { id: 9, name: "BRI Virtual Account", channel_code: "bri_va", payment_type: "virtual_account", fee_flat: 4000, fee_percent: 0, min_amount: 10000, balance: null },
  { id: 10, name: "Permata Virtual Account", channel_code: "permata_va", payment_type: "virtual_account", fee_flat: 4000, fee_percent: 0, min_amount: 10000, balance: null },
  { id: 11, name: "QRIS", channel_code: "qris", payment_type: "qris", fee_flat: 0, fee_percent: 0, min_amount: 1000, balance: null },
];

/** Appended only when a token is present, mirroring the real API. */
export const MOCK_BALANCE_CHANNEL: PaymentChannelModel = {
  id: 99,
  name: "Saldo Topup Game",
  channel_code: "balance",
  payment_type: "ewallet",
  fee_flat: 0,
  fee_percent: 0,
  min_amount: 0,
  balance: 250000,
};

export const MOCK_MEMBERSHIP_PLANS: MembershipPlanModel[] = [
  {
    id: 1,
    code: "silver",
    name: "Silver",
    benefits: ["Harga member untuk semua game", "Riwayat transaksi tersimpan", "Poin reward setiap pembelian"],
    price: 25000,
    duration_days: 30,
    is_popular: false,
  },
  {
    id: 2,
    code: "gold",
    name: "Gold",
    benefits: ["Semua benefit Silver", "Diskon tambahan hingga 3%", "Prioritas proses pesanan"],
    price: 50000,
    duration_days: 30,
    is_popular: true,
  },
  {
    id: 3,
    code: "platinum",
    name: "Platinum",
    benefits: ["Semua benefit Gold", "Harga reseller khusus", "Dukungan prioritas 24/7"],
    price: 100000,
    duration_days: 30,
    is_popular: false,
  },
];

export const MOCK_CURRENT_MEMBERSHIP: CurrentMembershipModel = {
  plan_code: "gold",
  plan_name: "Gold",
  starts_at: "2026-04-01T00:00:00Z",
  ends_at: "2027-04-01T00:00:00Z",
};

export const MOCK_PRICE_LIST: PriceListRow[] = MOCK_GAMES.flatMap((game) =>
  MOCK_PRODUCTS[game.slug].products.map((product, index) => ({
    id: game.id * 1000 + index + 1,
    service_name: product.name,
    code: product.code,
    game_id: game.id,
    game_name: game.name,
    game_slug: game.slug,
    game_region: game.region,
    game_logo_url: game.logo_url,
    normal_price: product.price,
    tiers: [
      { membership_plan_id: 1, plan_code: "silver", plan_name: "Silver", is_default: true, is_hidden: false, price: product.price },
      { membership_plan_id: 2, plan_code: "gold", plan_name: "Gold", is_default: false, is_hidden: false, price: Math.round(product.price * 0.97) },
      { membership_plan_id: 3, plan_code: "platinum", plan_name: "Platinum", is_default: false, is_hidden: true, price: null },
    ],
    status: "active",
    stock_left: product.stock_left,
    is_sold_out: product.is_sold_out,
  })),
);

export const MOCK_CHECKOUT_RESULT: CheckoutResult = {
  invoice_number: "INV-MOCK-0001",
  reference_id: "REF-MOCK-0001",
  product: { name: "355 Diamonds", price: 90000 },
  payment: {
    channel: "QRIS",
    type: "qris",
    amount: 90000,
    admin_fee: 0,
    status: "PENDING",
    instructions: {
      order_no: "REF-MOCK-0001",
      qr_string: "https://topupgame.example/pay/REF-MOCK-0001",
      is_single_use: true,
    },
  },
};

/** A settled invoice, so the tracker stops polling on the first response. */
export function mockInvoice(invoiceNumber: string): InvoiceModel {
  return {
    invoice_number: invoiceNumber,
    status: "COMPLETED",
    is_terminal: true,
    game: {
      name: "Mobile Legends Indonesia",
      slug: "mobile-legends-indonesia",
      region: "Moonton",
      logo_url: GAME_LOGO,
      thumbnail_url: GAME_THUMBNAILS[0],
    },
    product: { name: "355 Diamonds" },
    target: { uid: "123456789", server: "2201", nickname: "Mock Player" },
    amount: { base: 90000, fee: 0, admin_fee: 0, total: 90000 },
    points: { earned: 900, is_estimate: false, eligible: true },
    payment: {
      channel: "QRIS",
      channel_code: "qris",
      type: "qris",
      reference_id: "REF-MOCK-0001",
      status: "COMPLETED",
      paid_at: "2026-05-01T08:05:00Z",
      instructions: null,
    },
    refund: null,
    expires_at: null,
    sn: "SN-MOCK-0001",
    created_at: "2026-05-01T08:00:00Z",
  };
}
