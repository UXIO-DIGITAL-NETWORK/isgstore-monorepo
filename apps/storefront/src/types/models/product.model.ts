/**
 * One denomination from `GET /v1/games/{slug}/products`.
 *
 * `price` is already resolved for whoever asked — guests get the member price,
 * a signed-in reseller gets the reseller price. There is no second price to
 * choose from on the client, and cost/margin are never sent.
 */
export interface ProductModel {
  id: number;
  name: string;
  code: string;
  price: number;
  /** Sub-category label, used as the package category tab. */
  group: string;
  sub_category_id: number | null;
  /** Digits parsed from the name ("100 Diamonds" → 100), null when absent. */
  amount: number | null;
}

export interface GameProductsResponse {
  /** Distinct `group` values in display order — the tab strip. */
  groups: string[];
  products: ProductModel[];
}

/** One row of `GET /v1/storefront/payment-channels`. */
export interface PaymentChannelModel {
  id: number;
  name: string;
  channel_code: string;
  payment_type: "virtual_account" | "qris" | "ewallet" | "convenience_store" | "payment_link";
  fee_flat: number;
  fee_percent: number;
  min_amount: number;
  /** Spendable wallet amount — only set for the `balance` channel. */
  balance: number | null;
}
