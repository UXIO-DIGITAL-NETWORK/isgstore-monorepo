# Product prices become per membership plan

## What changed

A membership plan is now the pricing tier itself. Before, a plan was a way to
*buy a role*, and the role picked one of four fixed price columns on `products`
— so the platform was capped at four tiers no matter how many plans an admin
created. A fifth plan ("hokage") could never have its own price.

```
before:  plan → role_id → RolePrice → products.price_{member,vip,reseller,agent}
after:   plan → users.membership_plan_id → PlanPrice → product_plan_prices
```

`product_plan_prices` holds one row per (product × plan), so adding a plan needs
no migration and no release. `pricing_rules` are keyed on the plan too, and a
rule with **no** plan applies to every plan — the rung that keeps a
newly-invented tier priced instead of unpriced.

## Why it is shaped this way

**A new free default plan, rather than repurposing the existing "Basic".** The
site already sells a plan called Basic for Rp 50.000 that grants VIP pricing.
The brief's "Basic" is the free tier ordinary members are on. Zeroing the paid
plan's price would have given away what people paid for, so the migration
inserts a separate default plan and leaves every existing row untouched for the
admin to rename.

**Roles stopped deciding price.** Keeping both would have left two sources of
truth for what a customer pays, free to disagree with nothing noticing.
`memberships:expire` now reverts the *plan*; reverting the role would strip an
admin-assigned role from someone who merely let a subscription lapse.

**`products.price_member` survives as a denormalised copy** of the default
plan's price. Six queries sort and filter on it, and joining for all of them
would cost an index for no gain on the pages with real traffic. That buys one
invariant — `price_member` must equal the default-plan row — enforced by a
single writer (`WritePlanPricesAction`) and proven by `pricing:verify`.

**The fallback logs a warning.** If the migration runs and the backfill does
not, the price table is empty, resolution falls to `price_member`, and every
paying member is quietly sold at the base tier. Nothing errors. A silent wrong
price is worse than an outage, so the fallback is noisy and `pricing:verify`
fails the deploy.

**The public price list stopped lying.** It exposed `price_vip` under the name
`gold_price` — already a different plan's price. It now emits one column per
active plan in the admin's own order, and **withholds the top tier's price**:
that number is the reason to subscribe.

## Surface

**API** — new `product_plan_prices`; `membership_plans` gains `is_default`,
`allows_point_spending`, soft deletes; `users.membership_plan_id`;
`membership_subscriptions.price_paid`; `pricing_rules.membership_plan_id`
(`role` retired, now nullable). New `PlanPrice`, `MembershipResolver`,
`DefaultPlan`, `WritePlanPricesAction`, `MembershipPlanObserver`,
`SubscribeToMembershipPlanAction` (extracted from the controller, which held all
of it inline), and the `pricing:backfill-plan-prices` / `pricing:verify`
commands. `PricingService` is plan-keyed, with `computePrices()` kept as the
legacy five-column bridge.

**Admin** — pricing rules are chosen by plan, with an "All plans (fallback)"
option.

**Storefront** — the price table builds its columns from the plans the API
returns and hides the top tier's price.

## Deploy

`migrate --force && pricing:backfill-plan-prices` as **one step**, then
`pricing:verify` as a health check. Do not queue the backfill: a stalled queue
means wrong prices for hours with no signal.

## Deliberately not in this release

Per-SKU margins ("Set Profit Margin") are still authored on the four legacy
tiers and translated through the bridge — pricing *rules* are fully plan-driven,
per-SKU margin overrides are not yet. The three frozen price columns are dropped
in a follow-up once a release has been green in production. Points and
membership auto-renewal are separate releases.
