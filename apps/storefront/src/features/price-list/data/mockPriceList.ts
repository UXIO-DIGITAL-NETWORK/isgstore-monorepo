import gameLogo from "@/assets/images/game_logo/mobile_legends.png";

import type { PriceListItem } from "@/features/price-list/types/priceList.type";

// ── Price list rows ─────────────────────────────────────────────────────────
// NOTE: member/goldPrice and status are UI-only mock fields; the backend
// schema currently stores only a single `price` column per product.
export const mockPriceList: PriceListItem[] = [
  // ── Mobile Legends ──
  {
    id: 1,
    serviceName: "10050 (8540+1510) Diamond",
    gameId: "ml", gameName: "Mobile Legends", gameRegion: "Indonesia", gameLogo: gameLogo,
    normalPrice: 2_432_833, memberPrice: 2_432_833, goldPrice: 2_409_213, status: "active",
  },
  {
    id: 2,
    serviceName: "100 (92+8) Diamond",
    gameId: "ml", gameName: "Mobile Legends", gameRegion: "Indonesia", gameLogo: gameLogo,
    normalPrice: 26_809, memberPrice: 26_809, goldPrice: 26_549, status: "active",
  },
  {
    id: 3,
    serviceName: "1050 (937+113) Diamond",
    gameId: "ml", gameName: "Mobile Legends", gameRegion: "Indonesia", gameLogo: gameLogo,
    normalPrice: 267_169, memberPrice: 267_169, goldPrice: 264_575, status: "active",
  },
  {
    id: 4,
    serviceName: "150 (139+11) Diamond",
    gameId: "ml", gameName: "Mobile Legends", gameRegion: "Indonesia", gameLogo: gameLogo,
    normalPrice: 38_909, memberPrice: 38_909, goldPrice: 38_519, status: "active",
  },
  {
    id: 5,
    serviceName: "10 (9+1) Diamond",
    gameId: "ml", gameName: "Mobile Legends", gameRegion: "Indonesia", gameLogo: gameLogo,
    normalPrice: 2_939, memberPrice: 2_939, goldPrice: 2_910, status: "active",
  },
  {
    id: 6,
    serviceName: "110 (100+10) Diamond",
    gameId: "ml", gameName: "Mobile Legends", gameRegion: "Indonesia", gameLogo: gameLogo,
    normalPrice: 29_946, memberPrice: 29_946, goldPrice: 29_655, status: "active",
  },
  {
    id: 7,
    serviceName: "112 (102+10) Diamond",
    gameId: "ml", gameName: "Mobile Legends", gameRegion: "Indonesia", gameLogo: gameLogo,
    normalPrice: 30_410, memberPrice: 30_410, goldPrice: 30_114, status: "active",
  },
  {
    id: 8,
    serviceName: "1136 (1006+130) Diamond",
    gameId: "ml", gameName: "Mobile Legends", gameRegion: "Indonesia", gameLogo: gameLogo,
    normalPrice: 288_135, memberPrice: 288_135, goldPrice: 285_338, status: "active",
  },
  {
    id: 9,
    serviceName: "1159 (1031+128) Diamond",
    gameId: "ml", gameName: "Mobile Legends", gameRegion: "Indonesia", gameLogo: gameLogo,
    normalPrice: 294_678, memberPrice: 294_678, goldPrice: 291_817, status: "active",
  },
  {
    id: 10,
    serviceName: "11 (10+1) Diamond",
    gameId: "ml", gameName: "Mobile Legends", gameRegion: "Indonesia", gameLogo: gameLogo,
    normalPrice: 3_440, memberPrice: 3_440, goldPrice: 3_407, status: "active",
  },
  {
    id: 11,
    serviceName: "1220 (1093+127) Diamond",
    gameId: "ml", gameName: "Mobile Legends", gameRegion: "Indonesia", gameLogo: gameLogo,
    normalPrice: 312_208, memberPrice: 312_208, goldPrice: 309_177, status: "active",
  },
  {
    id: 12,
    serviceName: "200 (184+16) Diamond",
    gameId: "ml", gameName: "Mobile Legends", gameRegion: "Indonesia", gameLogo: gameLogo,
    normalPrice: 53_218, memberPrice: 53_218, goldPrice: 52_686, status: "active",
  },

  // ── Free Fire ──
  {
    id: 13,
    serviceName: "Diamonds 70",
    gameId: "ff", gameName: "Free Fire", gameRegion: "Indonesia", gameLogo: gameLogo,
    normalPrice: 14_000, memberPrice: 14_000, goldPrice: 13_860, status: "active",
  },
  {
    id: 14,
    serviceName: "Diamonds 140",
    gameId: "ff", gameName: "Free Fire", gameRegion: "Indonesia", gameLogo: gameLogo,
    normalPrice: 27_900, memberPrice: 27_900, goldPrice: 27_621, status: "active",
  },
  {
    id: 15,
    serviceName: "Diamonds 355",
    gameId: "ff", gameName: "Free Fire", gameRegion: "Indonesia", gameLogo: gameLogo,
    normalPrice: 69_100, memberPrice: 69_100, goldPrice: 68_409, status: "active",
  },
  {
    id: 16,
    serviceName: "Diamonds 720",
    gameId: "ff", gameName: "Free Fire", gameRegion: "Indonesia", gameLogo: gameLogo,
    normalPrice: 138_600, memberPrice: 138_600, goldPrice: 137_214, status: "active",
  },
  {
    id: 17,
    serviceName: "Diamonds 1450",
    gameId: "ff", gameName: "Free Fire", gameRegion: "Indonesia", gameLogo: gameLogo,
    normalPrice: 277_200, memberPrice: 277_200, goldPrice: 274_428, status: "active",
  },
  {
    id: 18,
    serviceName: "Diamonds 2180",
    gameId: "ff", gameName: "Free Fire", gameRegion: "Indonesia", gameLogo: gameLogo,
    normalPrice: 415_800, memberPrice: 415_800, goldPrice: 411_642, status: "active",
  },
  {
    id: 19,
    serviceName: "Diamonds 5600",
    gameId: "ff", gameName: "Free Fire", gameRegion: "Indonesia", gameLogo: gameLogo,
    normalPrice: 1_038_000, memberPrice: 1_038_000, goldPrice: 1_027_620, status: "active",
  },
  {
    id: 20,
    serviceName: "Weekly Membership",
    gameId: "ff", gameName: "Free Fire", gameRegion: "Indonesia", gameLogo: gameLogo,
    normalPrice: 56_300, memberPrice: 56_300, goldPrice: 55_737, status: "inactive",
  },

  // ── PUBG Mobile ──
  {
    id: 21,
    serviceName: "60 UC",
    gameId: "pubg", gameName: "PUBG Mobile", gameRegion: "Level Infinite", gameLogo: gameLogo,
    normalPrice: 15_000, memberPrice: 15_000, goldPrice: 14_850, status: "active",
  },
  {
    id: 22,
    serviceName: "300 UC",
    gameId: "pubg", gameName: "PUBG Mobile", gameRegion: "Level Infinite", gameLogo: gameLogo,
    normalPrice: 73_000, memberPrice: 73_000, goldPrice: 72_270, status: "active",
  },
  {
    id: 23,
    serviceName: "600 UC",
    gameId: "pubg", gameName: "PUBG Mobile", gameRegion: "Level Infinite", gameLogo: gameLogo,
    normalPrice: 143_000, memberPrice: 143_000, goldPrice: 141_570, status: "active",
  },
  {
    id: 24,
    serviceName: "1500 UC",
    gameId: "pubg", gameName: "PUBG Mobile", gameRegion: "Level Infinite", gameLogo: gameLogo,
    normalPrice: 348_000, memberPrice: 348_000, goldPrice: 344_520, status: "active",
  },
  {
    id: 25,
    serviceName: "3000 UC",
    gameId: "pubg", gameName: "PUBG Mobile", gameRegion: "Level Infinite", gameLogo: gameLogo,
    normalPrice: 683_000, memberPrice: 683_000, goldPrice: 676_170, status: "active",
  },
  {
    id: 26,
    serviceName: "6000 UC",
    gameId: "pubg", gameName: "PUBG Mobile", gameRegion: "Level Infinite", gameLogo: gameLogo,
    normalPrice: 1_355_000, memberPrice: 1_355_000, goldPrice: 1_341_450, status: "active",
  },
  {
    id: 27,
    serviceName: "Elite Pass Season",
    gameId: "pubg", gameName: "PUBG Mobile", gameRegion: "Level Infinite", gameLogo: gameLogo,
    normalPrice: 130_000, memberPrice: 130_000, goldPrice: 128_700, status: "active",
  },

  // ── Genshin Impact ──
  {
    id: 28,
    serviceName: "60 Genesis Crystals",
    gameId: "genshin", gameName: "Genshin Impact", gameRegion: "moHoyo", gameLogo: gameLogo,
    normalPrice: 15_000, memberPrice: 15_000, goldPrice: 14_850, status: "active",
  },
  {
    id: 29,
    serviceName: "300 Genesis Crystals",
    gameId: "genshin", gameName: "Genshin Impact", gameRegion: "moHoyo", gameLogo: gameLogo,
    normalPrice: 73_000, memberPrice: 73_000, goldPrice: 72_270, status: "active",
  },
  {
    id: 30,
    serviceName: "980 Genesis Crystals",
    gameId: "genshin", gameName: "Genshin Impact", gameRegion: "moHoyo", gameLogo: gameLogo,
    normalPrice: 235_000, memberPrice: 235_000, goldPrice: 232_650, status: "active",
  },
  {
    id: 31,
    serviceName: "1980 Genesis Crystals",
    gameId: "genshin", gameName: "Genshin Impact", gameRegion: "moHoyo", gameLogo: gameLogo,
    normalPrice: 468_000, memberPrice: 468_000, goldPrice: 463_320, status: "active",
  },
  {
    id: 32,
    serviceName: "3280 Genesis Crystals",
    gameId: "genshin", gameName: "Genshin Impact", gameRegion: "moHoyo", gameLogo: gameLogo,
    normalPrice: 768_000, memberPrice: 768_000, goldPrice: 760_320, status: "active",
  },
  {
    id: 33,
    serviceName: "6480 Genesis Crystals",
    gameId: "genshin", gameName: "Genshin Impact", gameRegion: "moHoyo", gameLogo: gameLogo,
    normalPrice: 1_512_000, memberPrice: 1_512_000, goldPrice: 1_496_880, status: "active",
  },
  {
    id: 34,
    serviceName: "Blessing of the Welkin Moon",
    gameId: "genshin", gameName: "Genshin Impact", gameRegion: "moHoyo", gameLogo: gameLogo,
    normalPrice: 78_000, memberPrice: 78_000, goldPrice: 77_220, status: "active",
  },
  {
    id: 35,
    serviceName: "Battle Pass Gnostic Hymn",
    gameId: "genshin", gameName: "Genshin Impact", gameRegion: "moHoyo", gameLogo: gameLogo,
    normalPrice: 156_000, memberPrice: 156_000, goldPrice: 154_440, status: "inactive",
  },
];
