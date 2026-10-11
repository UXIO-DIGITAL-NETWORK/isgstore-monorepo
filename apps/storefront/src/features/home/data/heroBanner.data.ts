import { IMAGES } from "@/constants/images";
import type { HeroBannerItem } from "../types/heroBanner.type";

export const BANNERS: HeroBannerItem[] = [
  {
    src: IMAGES.BANNER_7,
    srcSet: IMAGES.BANNER_7_SRCSET,
    alt: "Welcome to TopupGame.ID – Top up semua game, harga murah",
  },
  {
    src: IMAGES.BANNER_8,
    srcSet: IMAGES.BANNER_8_SRCSET,
    alt: "Promo Top Up Spesial – Bonus hingga +20%",
  },
  {
    src: IMAGES.BANNER_9,
    srcSet: IMAGES.BANNER_9_SRCSET,
    alt: "Beli 1 Gratis 1 – Top Up Game Favoritmu",
  },
];
