export type FlashSaleItem = {
  id: string;
  /** The game's slug — what the checkout route takes. Not the item's own id. */
  gameSlug: string;
  name: string;
  game: string;
  image: string;
  salePrice: number;
  originalPrice: number;
  /** A percentage, not rupiah. */
  discount: number;
  stockAvailable: number;
  stockTotal: number;
};
