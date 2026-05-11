import { IMAGES } from "@/constants/images";
import type { HeroBannerItem } from "../types/hero-banner.type";

export const BANNERS: HeroBannerItem[] = [
  {
    src: IMAGES.BANNER_1,
    alt: "Welcome to TopupGame.ID – Top up semua game, harga murah",
  },
  {
    src: IMAGES.BANNER_2,
    alt: "Promo Top Up Spesial – Bonus hingga +20%",
  },
  {
    src: IMAGES.BANNER_3,
    alt: "Beli 1 Gratis 1 – Top Up Game Favoritmu",
  },
];

export const AUTO_DELAY = 4500;
export const SIDE_VISIBLE = 52;
export const GAP_PX = 4;
