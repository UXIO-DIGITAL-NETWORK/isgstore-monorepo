import type { GameDetailModel, GameModel, OrderFormField } from "@/types/models/game.model";
import type { GameProductsResponse, ProductModel } from "@/types/models/product.model";
import type { GameReviewsResponse } from "@/features/checkout/types/checkout.type";

import { GAME_LOGO, GAME_THUMBNAILS, POPULAR_IMAGES } from "./assets";

interface GameSeed {
  name: string;
  /** Publisher, shown as the card's region line (matches the Figma). */
  publisher: string;
  category: "MOBA" | "Battle Royale" | "FPS" | "PC Games" | "Voucher";
  slug: string;
  thumbnail: string;
  logo?: string;
}

/**
 * The catalogue the homepage grid, the popular rail and the navbar search all
 * read. Names, publishers and categories mirror the Figma homepage; the last
 * few fill the 2×6 grid and keep every category tab non-empty.
 */
const SEEDS: GameSeed[] = [
  { name: "Mobile Legends Indonesia", publisher: "Moonton", category: "MOBA", slug: "mobile-legends-indonesia", thumbnail: GAME_THUMBNAILS[0], logo: GAME_LOGO },
  { name: "Mobile Legends Global", publisher: "Moonton", category: "MOBA", slug: "mobile-legends-global", thumbnail: GAME_THUMBNAILS[1], logo: GAME_LOGO },
  { name: "Free Fire Garena Indonesia", publisher: "Garena", category: "Battle Royale", slug: "free-fire", thumbnail: GAME_THUMBNAILS[2] },
  { name: "Roblox Game Indonesia", publisher: "Sandboxed", category: "PC Games", slug: "roblox", thumbnail: GAME_THUMBNAILS[3] },
  { name: "PUBG MOBILE Indonesia", publisher: "Tencent Games", category: "Battle Royale", slug: "pubg-mobile", thumbnail: GAME_THUMBNAILS[4] },
  { name: "Genshin Impact Indonesia", publisher: "moHoyo", category: "PC Games", slug: "genshin-impact", thumbnail: GAME_THUMBNAILS[5] },
  { name: "Valorant", publisher: "Riot Games", category: "FPS", slug: "valorant", thumbnail: POPULAR_IMAGES[0] },
  { name: "Call of Duty Mobile", publisher: "Activision", category: "FPS", slug: "cod-mobile", thumbnail: POPULAR_IMAGES[1] },
  { name: "Honor of Kings", publisher: "Tencent Games", category: "MOBA", slug: "honor-of-kings", thumbnail: POPULAR_IMAGES[2] },
  { name: "Honkai: Star Rail", publisher: "HoYoverse", category: "PC Games", slug: "honkai-star-rail", thumbnail: POPULAR_IMAGES[3] },
  { name: "Google Play Voucher", publisher: "Google", category: "Voucher", slug: "google-play-voucher", thumbnail: POPULAR_IMAGES[4] },
  { name: "Steam Wallet", publisher: "Valve", category: "Voucher", slug: "steam-wallet", thumbnail: POPULAR_IMAGES[5] },
];

const initialsOf = (name: string): string =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0] ?? "")
    .join("")
    .toUpperCase();

export const MOCK_GAMES: GameModel[] = SEEDS.map((seed, index) => ({
  id: index + 1,
  name: seed.name,
  sub_name: seed.publisher,
  region: seed.publisher,
  slug: seed.slug,
  code: seed.slug.toUpperCase().replace(/-/g, "_"),
  logo_url: seed.logo ?? null,
  thumbnail_url: seed.thumbnail,
  banner_url: seed.thumbnail,
  initials: initialsOf(seed.name),
  category_type: { id: index + 1, name: seed.category },
}));

/** Games whose order form needs a second identifier (a zone or a server). */
const SECOND_FIELD: Record<string, { key: string; label: string; placeholder: string }> = {
  "mobile-legends-indonesia": { key: "zone_id", label: "Zone ID", placeholder: "Masukkan Zone ID" },
  "mobile-legends-global": { key: "zone_id", label: "Zone ID", placeholder: "Masukkan Zone ID" },
  "genshin-impact": { key: "server_id", label: "Server", placeholder: "Masukkan Server" },
};

/** Games that run a supplier nickname lookup — drives "Cek Username". */
const NICKNAME_CHECK = new Set([
  "mobile-legends-indonesia",
  "mobile-legends-global",
  "free-fire",
  "pubg-mobile",
  "cod-mobile",
  "valorant",
]);

function primaryField(): OrderFormField {
  return {
    key: "user_id",
    label: "User ID",
    type: "number",
    required: true,
    min_length: 5,
    max_length: 20,
    pattern: null,
    options: [],
    placeholder: "Masukkan User ID",
    help: null,
  };
}

function buildDetail(game: GameModel): GameDetailModel {
  const fields: OrderFormField[] = [primaryField()];
  const second = SECOND_FIELD[game.slug];

  if (second) {
    fields.push({
      key: second.key,
      label: second.label,
      type: "number",
      required: true,
      min_length: null,
      max_length: null,
      pattern: null,
      options: [],
      placeholder: second.placeholder,
      help: null,
    });
  }

  return {
    ...game,
    description: `Top up ${game.name} cepat, aman, dan otomatis — diproses dalam hitungan detik.`,
    order_form_fields: fields,
    supports_nickname_check: NICKNAME_CHECK.has(game.slug),
    meta: {
      title: `Top Up ${game.name}`,
      description: `Top up ${game.name} di Topup Game, harga murah dan proses instan.`,
      keywords: [game.name, "top up", "voucher game"],
      robots: null,
      og_image_url: game.thumbnail_url,
    },
  };
}

export const MOCK_GAME_DETAILS: Record<string, GameDetailModel> = Object.fromEntries(
  MOCK_GAMES.map((game) => [game.slug, buildDetail(game)]),
);

const UNIT_BY_SLUG: Record<string, string> = {
  roblox: "Robux",
  "pubg-mobile": "UC",
  "free-fire": "Diamonds",
  "cod-mobile": "CP",
  valorant: "VP",
};

const DENOMINATIONS = [
  { amount: 5, price: 1500 },
  { amount: 12, price: 3500 },
  { amount: 19, price: 5500 },
  { amount: 36, price: 10000 },
  { amount: 74, price: 20000 },
  { amount: 172, price: 45000 },
  { amount: 257, price: 65000 },
  { amount: 355, price: 90000 },
  { amount: 706, price: 180000 },
];

const VOUCHER_DENOMINATIONS = [
  { amount: 10000, price: 10500 },
  { amount: 25000, price: 26000 },
  { amount: 50000, price: 51500 },
  { amount: 100000, price: 102500 },
  { amount: 250000, price: 255000 },
];

function buildProducts(game: GameModel): GameProductsResponse {
  const isVoucher = game.category_type?.name === "Voucher";
  const denoms = isVoucher ? VOUCHER_DENOMINATIONS : DENOMINATIONS;
  const unit = UNIT_BY_SLUG[game.slug] ?? "Diamonds";

  const products: ProductModel[] = denoms.map((denomination, index) => ({
    id: game.id * 100 + index + 1,
    name: isVoucher ? `Voucher Rp ${denomination.amount}` : `${denomination.amount} ${unit}`,
    code: `${game.code}_${index + 1}`,
    price: denomination.price,
    group: isVoucher ? "Voucher" : "Diamonds",
    sub_category_id: null,
    amount: denomination.amount,
    point_percent: 1,
    point_flat: 0,
    stock_left: null,
    is_sold_out: false,
  }));

  if (!isVoucher) {
    // A second group so the package category tabs are exercised.
    products.push({
      id: game.id * 100 + 90,
      name: "Weekly Diamond Pass",
      code: `${game.code}_WDP`,
      price: 28000,
      group: "Weekly Pass",
      sub_category_id: null,
      amount: null,
      point_percent: 2,
      point_flat: 0,
      stock_left: 50,
      is_sold_out: false,
    });
  }

  return { groups: [...new Set(products.map((product) => product.group))], products };
}

export const MOCK_PRODUCTS: Record<string, GameProductsResponse> = Object.fromEntries(
  MOCK_GAMES.map((game) => [game.slug, buildProducts(game)]),
);

export const MOCK_REVIEWS: GameReviewsResponse = {
  summary: {
    average: 4.8,
    total: 3,
    breakdown: [
      { stars: 5, count: 2, percentage: 67 },
      { stars: 4, count: 1, percentage: 33 },
      { stars: 3, count: 0, percentage: 0 },
      { stars: 2, count: 0, percentage: 0 },
      { stars: 1, count: 0, percentage: 0 },
    ],
  },
  reviews: {
    data: [
      {
        id: 1,
        author: "Budi S.",
        rating: 5,
        comment: "Prosesnya cepat, diamond langsung masuk ke akun.",
        masked_user_id: "82****21",
        product: "355 Diamonds",
        created_at: "2026-04-28T10:00:00Z",
      },
      {
        id: 2,
        author: "Siti R.",
        rating: 5,
        comment: "Harga murah dan pembayaran lengkap. Recommended!",
        masked_user_id: "11****90",
        product: "172 Diamonds",
        created_at: "2026-04-21T14:30:00Z",
      },
      {
        id: 3,
        author: "Andi P.",
        rating: 4,
        comment: "Top up aman, cuma sempat antre sebentar.",
        masked_user_id: "77****05",
        product: "706 Diamonds",
        created_at: "2026-04-12T09:15:00Z",
      },
    ],
  },
};
