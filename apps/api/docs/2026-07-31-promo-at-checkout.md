# 2026-07-31 — Promo codes applied at checkout

## What changed

`CheckoutAction` now accepts `promo_code`, resolves it server-side, reduces the price, records a redemption and stores the discount on the transaction. Until now a code could be *validated* but nothing consumed it — the customer was quoted a discount they never received.

- `app/Support/Promo/PromoResolver.php` (new) — the single definition of what a code is worth.
- `CheckoutAction` — promo block between the margin guard and the fee calculation.
- `CheckoutDTO` / `StoreCheckoutRequest` / `CheckoutController` — carry `promo_code`.
- `TransactionResource` — exposes `promo_id` and `discount_amount`.
- `ShowInvoiceAction` — the public invoice now reports `amount.discount`.
- Storefront: the checkout page holds the applied promo, sends the code, and the trigger row shows which code is applied with a Remove action.

## Why one resolver

Both the validate endpoint and checkout resolve through `PromoResolver`. If each computed its own discount the two could drift, and the customer would be **quoted one number and charged another** — the worst way for this to be wrong. `MarketingController::validatePromo` was rewritten to delegate rather than keep its own copy.

## The margin decision

The discount comes out of margin. A code worth more than the margin would sell below cost.

Two options: cap the discount silently, or refuse. **Refusing** was chosen — capping would honour less than the customer was promised, and only one of the two failure modes loses money quietly. A code that exceeds margin on a product is an admin misconfiguration, and it surfaces as *"Kode promo tidak dapat digunakan untuk produk ini."*

Other guarantees, all mirroring the existing checkout invariants:

- the promo row is locked for the write, so two concurrent redemptions cannot both slip past a quota of one;
- the code is re-resolved server-side, so the client's quoted discount is never trusted;
- an invalid code **fails the order** rather than being silently dropped — a customer who typed a code and was charged full price without being told would have no way to know;
- the fee is computed on the discounted price, since that is what the customer is actually charged;
- per-user quota does not apply to guests — there is no identity to count against.

## Two bugs found while verifying

**1. `payment_channels.payment_type` was still an ENUM on MySQL.** The 2026-06-21 migration widened it to a string on SQLite but left MySQL alone, so the two environments disagreed and production could not store any value outside the original five.

**Consequence: the internal wallet channel could not exist.** `CheckoutAction`, `RefundFailedTransactionAction` and `ListPaymentChannelsAction` all branch on `channel_code === 'balance'` — three live code paths with nothing that could ever trigger them, and no member could spend their balance. Fixed by `2026_08_04_000001_widen_payment_type_on_payment_channels`.

**2. No `balance` channel was seeded.** Even with the column fixed, the row did not exist. Added to `PaymentChannelSeeder` (without `fee_flat`/`fee_percent`, because the seeder does a bulk upsert and every row must carry the same column list).

## Verification

Arithmetic verified against the live database with the Digiflazz supplier call stubbed — that call is IP-whitelisted and unreachable from here, and it happens after all the amount computation:

```
product: Free Fire 355 Diamond | price 53760 | cost 44800 | margin 8960
  amount_base     48760   OK   (53760 − 5000)
  discount_amount 5000    OK
  amount_fee      0       OK
  amount_total    48760   OK
  margin          3960    OK   (8960 − 5000)
  promo_id        2       OK
  redemptions     1       OK
  used_count      1       OK
  wallet charged  48760   OK
```

Guard paths verified inside `CheckoutAction`:

- per-user quota → *"Kamu sudah menggunakan kode promo ini."*
- discount exceeds margin → *"Kode promo tidak dapat digunakan untuk produk ini."*
- unknown code → *"Kode promo tidak ditemukan atau sudah tidak berlaku."* (order refused, not silently full-priced)

Consistency: `validate` quoted 5376 for `HEMAT10` on a Rp 53.760 product (10%, under the Rp 10.000 cap) — the same figure `PromoResolver` gives checkout.

Gates: `pint` clean, 250 routes, admin FE 360 tests / `tsc` / lint / build all clean, storefront `tsc` / lint / build clean.

## Not verified end to end

The full HTTP checkout cannot complete on this machine: Digiflazz rejects the request with *"IP Anda tidak kami kenali"*, and the Monetapay sandbox 404s on some channel types. Both are external services, and both are called after the promo arithmetic. The stubbed run above is what proves the numbers.
