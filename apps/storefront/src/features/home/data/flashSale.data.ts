import { IMAGES } from "@/constants/images";
import type { FlashSaleItem } from "../types/flashSale.type";

export const FLASH_SALE_DURATION_SECONDS = 23 * 3600 + 30 * 60 + 2;

export const FLASH_SALE_ITEMS: FlashSaleItem[] = [
  {
    id: "fs-1",
    name: "500 Robux",
    game: "Roblox",
    image: IMAGES.FLASH_SALE_1,
    salePrice: 72500,
    originalPrice: 75000,
    discount: 2500,
    stockAvailable: 93,
    stockTotal: 100,
  },
  {
    id: "fs-2",
    name: "700 Robux",
    game: "Roblox",
    image: IMAGES.FLASH_SALE_1,
    salePrice: 82500,
    originalPrice: 85000,
    discount: 2500,
    stockAvailable: 93,
    stockTotal: 100,
  },
  {
    id: "fs-3",
    name: "800 Robux",
    game: "Roblox",
    image: IMAGES.FLASH_SALE_1,
    salePrice: 93000,
    originalPrice: 96000,
    discount: 3000,
    stockAvailable: 93,
    stockTotal: 100,
  },
  {
    id: "fs-4",
    name: "8100 UC",
    game: "PUBG",
    image: IMAGES.FLASH_SALE_1,
    salePrice: 102500,
    originalPrice: 105500,
    discount: 3000,
    stockAvailable: 93,
    stockTotal: 100,
  },
  {
    id: "fs-5",
    name: "9100 UC",
    game: "PUBG",
    image: IMAGES.FLASH_SALE_1,
    salePrice: 120500,
    originalPrice: 123500,
    discount: 3000,
    stockAvailable: 93,
    stockTotal: 100,
  },
];
