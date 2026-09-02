# Loyalty points, per-plan SKU margins, and membership auto-renewal

Completes the three-part release that began with per-membership pricing.

## What changed

**Per-SKU margins became plan-keyed.** `supplier_products.margin_{member,vip,
reseller,agent}` were the last four-tier cap in the pricing chain: an admin could
set a *rule* for a plan they had just created, but not a *margin*. Margins now
live in `supplier_product_margins`, one row per (mapping × plan), and the "Set
Profit Margin" screen builds one field per plan.

**Points became real.** They were a dead scaffold — `users.point`,
`point_histories`, and an admin CRUD that wrote the history table without ever
moving the balance. Now:

```
order COMPLETED (paid AND delivered)
  → GrantTransactionPointsAction  → point_ledger 'earn'   → users.point
checkout step 4c
  → PointLedger 'spend'           → discount before the fee
refund
  → 'refund_return' (points back as points, cash back as balance)
  → 'earn_reversal' when a delivered order is refunded, capped at the balance
```

**Membership auto-renewal.** `memberships:renew` charges the wallet for a
duration-based plan about to lapse, on by default with a member-facing switch.

## Why it is shaped this way

**Points are granted only when the order is genuinely done**, which is what the
brief asked for and what removes almost the whole clawback problem: a failed
order never produces points to take back. The residual case — an admin refunding
a delivered order as goodwill — claws back only as far as the balance allows.
A negative point balance would silently swallow everything the customer earned
next, with nothing on screen to explain it.

**Points are not a payment channel.** They usually cover part of an order, and
modelling them as a channel would make a small balance useless until it grew.
Applying them before the fee is also what leaves `payments.gross_amount` as the
rupiah remainder — so refunding a mixed order needs no arithmetic at all.

**Points are not deducted from margin.** A promo is the platform eating its own
margin; a point was already paid for in cash on an earlier order. Charging it to
margin would have made the margin guard reject legitimate redemptions on thin
products, and would have buried the cost of the programme inside a number
finance cannot break out.

**Auto-renew writes a successor subscription** rather than extending the old row.
That gives `memberships:expire` its existing "still covered" answer for free, so
the two scheduled commands need no ordering guarantee — much sturdier than a
five-minute cron gap. `renewed_into_id` is uniquely indexed because a row lock
does not protect two workers on separate connections, and this debits a wallet.

**Renewal refuses a price that rose more than 20%** since purchase. Silently
charging far more than someone agreed to is how disputes start.

## The two crash sites worth knowing about

`WalletLedger::record` throws on a zero amount. A fully points-covered order
owes exactly Rp 0, and so does its refund. Both call sites are guarded on `> 0`;
this was the most likely bug in the whole feature.

A points-paid order still writes a `payments` row at zero. `InitiateRefundAction`
returns early on `! $payment`, so without it such an order could never be
refunded at all.

## Surface

**API** — `supplier_product_margins`, `point_ledger`; `products.point_percent` /
`point_flat`; `transactions.points_spent` / `points_spent_amount` /
`points_earned`; `refund_requests.points_amount`; `users.auto_renew`;
`membership_subscriptions.renewed_into_id`. New `PointLedger`, `PointRules`,
`GrantTransactionPointsAction`, `RenewMemberships`, `MemberPointController`
(`GET /v1/me/points`, `/v1/me/point-history`), `PATCH /v1/me/membership/auto-renew`.

**Admin** — the margin screen is one field per plan.

**Storefront** — a "Use Points" step at checkout with the discount on the
summary, and the point maths in `features/checkout/lib/points.ts` (the Vitest
glob excludes `.tsx`, so testable logic has to live in a `lib` file).

## Settings

`points.earn_percent`, `points.earn_flat`, `points.redeem_rate`, and
`pricing.default_markup_percent` are seeded and editable.
