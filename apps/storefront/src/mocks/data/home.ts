import type { FlashSaleModel } from "@/hooks/useFlashSaleQuery";
import type { PromoModel } from "@/hooks/usePromoQuery";
import type { PublicSettings } from "@/hooks/useSettingsQuery";
import type {
  AnnouncementModel,
  BannerModel,
  LeaderboardEntryModel,
  TestimonialModel,
} from "@/services/storefront.service";

import { ARTICLE_IMAGES, BANNER_IMAGES, FLASH_SALE_IMAGE } from "./assets";

/**
 * Homepage fixtures, matching the "Design Topup Game" Figma file
 * (`homepage-design.json` / `design_system.md` §11). Six hero slides — the same
 * count as the design's pagination.
 */
export const MOCK_BANNERS: BannerModel[] = BANNER_IMAGES.map((image, index) => ({
  id: index + 1,
  name: [
    "Welcome to TopupGame.ID – Top up semua game, harga murah",
    "Promo Top Up Spesial – Bonus hingga +20%",
    "Beli 1 Gratis 1 – Top Up Game Favoritmu",
    "Bayar Pakai QRIS – Proses Lebih Cepat",
    "Top Up 24 Jam – Otomatis & Aman",
    "Kumpulkan Poin – Tukar Jadi Diskon",
  ][index],
  link: null,
  image_url: image,
}));

export const MOCK_ANNOUNCEMENTS: AnnouncementModel[] = [
  {
    id: 1,
    content: "Layanan top up tetap buka 24 jam selama libur nasional. Proses otomatis, aman, dan terpercaya.",
    image_url: null,
  },
];

export const MOCK_TESTIMONIALS: TestimonialModel[] = [
  {
    id: 1,
    author: "Rizky Pratama",
    title: "Prosesnya super cepat",
    avatar_url: null,
    content: "Baru bayar, diamond langsung masuk. Harga juga lebih murah dari tempat lain.",
    rating: 5,
    game: "Mobile Legends",
    is_featured: true,
  },
  {
    id: 2,
    author: "Dewi Lestari",
    title: "Pembayaran lengkap",
    avatar_url: null,
    content: "Bisa bayar pakai QRIS dan e-wallet. Nggak pernah gagal, sudah langganan di sini.",
    rating: 5,
    game: "PUBG Mobile",
    is_featured: true,
  },
  {
    id: 3,
    author: "Fajar Nugroho",
    title: "CS-nya responsif",
    avatar_url: null,
    content: "Sempat salah User ID, dibantu admin sampai beres. Recommended banget.",
    rating: 4,
    game: "Roblox",
    is_featured: false,
  },
];

const discountOf = (sale: number, original: number): number =>
  Math.max(0, Math.round((1 - sale / original) * 100));

const FLASH_SEEDS = [
  { id: 1, name: "500 Robux", game: "Roblox", gameSlug: "roblox", sale: 72500, original: 75000 },
  { id: 2, name: "700 Robux", game: "Roblox", gameSlug: "roblox", sale: 82500, original: 85000 },
  { id: 3, name: "800 Robux", game: "Roblox", gameSlug: "roblox", sale: 93000, original: 96000 },
  { id: 4, name: "8100 UC", game: "PUBG", gameSlug: "pubg-mobile", sale: 102500, original: 110000 },
  { id: 5, name: "9100 UC", game: "Roblox", gameSlug: "roblox", sale: 120500, original: 125000 },
  { id: 6, name: "1000 UC", game: "Roblox", gameSlug: "roblox", sale: 135500, original: 140000 },
];

/**
 * The countdown ends ~23h30m from module load, so the timer always ticks
 * instead of showing a fixed time that has already passed.
 */
const FLASH_SALE_ENDS_AT = new Date(Date.now() + 23.5 * 60 * 60 * 1000).toISOString();

export const MOCK_FLASH_SALE: FlashSaleModel = {
  id: 1,
  name: "Flash Sale Hari Ini",
  starts_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  ends_at: FLASH_SALE_ENDS_AT,
  items: FLASH_SEEDS.map((seed, index) => ({
    id: seed.id,
    product_id: 1000 + index,
    name: seed.name,
    game: seed.game,
    game_slug: seed.gameSlug,
    image_url: FLASH_SALE_IMAGE,
    sale_price: seed.sale,
    original_price: seed.original,
    discount: discountOf(seed.sale, seed.original),
    stock_available: 93,
    stock_total: 100,
  })),
};

export const MOCK_PROMOS: PromoModel[] = [
  {
    id: 1,
    code: "HEMAT10",
    name: "Diskon 10%",
    description: "Potongan 10% untuk semua top up, maksimal Rp 15.000.",
    type: "percentage",
    value: 10,
    max_discount: 15000,
    min_purchase: 20000,
    ends_at: null,
  },
  {
    id: 2,
    code: "NEWUSER",
    name: "Voucher Pengguna Baru",
    description: "Potongan Rp 5.000 untuk transaksi pertamamu.",
    type: "fixed",
    value: 5000,
    max_discount: null,
    min_purchase: 25000,
    ends_at: null,
  },
];

export const MOCK_SETTINGS: PublicSettings = {
  site_name: "Topup Game",
  logo: null,
  meta_title: "Topup Game – Top Up Semua Game, Cepat & Aman",
  meta_description: "Platform top up game cepat, aman, dan praktis untuk berbagai kebutuhan digital Anda.",
  og_image: ARTICLE_IMAGES[0],
  favicon: null,
  maintenance_mode: false,
  contact_whatsapp: "6281234567890",
  contact_email: "support@topupgaming.com",
  operational_hours: "Jam Operasional: 24 Jam",
  footer_description:
    "Platform top up game yang menyediakan layanan cepat, aman, dan praktis untuk berbagai kebutuhan digital Anda.",
  copyright_text: "© 2026 Topup Game. All Rights Reserved.",
  balance_topup_presets: [10000, 25000, 50000, 100000, 500000],
};

const LEADERBOARD: LeaderboardEntryModel[] = [
  { rank: 1, player_name: "pr***a", total_amount: 12500000, total_orders: 214 },
  { rank: 2, player_name: "ek***ta", total_amount: 9800000, total_orders: 176 },
  { rank: 3, player_name: "ba***ng", total_amount: 7450000, total_orders: 141 },
  { rank: 4, player_name: "si***wi", total_amount: 5120000, total_orders: 98 },
  { rank: 5, player_name: "gu***us", total_amount: 4310000, total_orders: 87 },
  { rank: 6, player_name: "ra***fi", total_amount: 3875000, total_orders: 72 },
  { rank: 7, player_name: "me***ka", total_amount: 3120000, total_orders: 63 },
  { rank: 8, player_name: "an***ri", total_amount: 2740000, total_orders: 55 },
  { rank: 9, player_name: "di***ah", total_amount: 2210000, total_orders: 47 },
  { rank: 10, player_name: "yo***da", total_amount: 1850000, total_orders: 39 },
];

export function leaderboardFor(period: string): { period: string; entries: LeaderboardEntryModel[] } {
  // Scale the totals so the period pills visibly change the board.
  const factor = period === "week" ? 0.35 : period === "month" ? 0.7 : 1;
  return {
    period,
    entries: LEADERBOARD.map((entry) => ({
      ...entry,
      total_amount: Math.round(entry.total_amount * factor),
    })),
  };
}
