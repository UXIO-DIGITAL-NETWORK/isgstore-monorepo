# 2026-09-01 — Pricing keyed on membership plan

**Scope:** `pricing`, `products`
**Type:** feat
**Author/agent:** you

## What changed

- `PricingRuleFormDialog` and its zod schema select a **membership plan** (Basic / Platinum / Gold) instead of a role; `pricingRule.type.ts` and `pricing.service.ts` follow.
- `ProviderMarginBulkPage` sets margins per plan, so a single product can carry a genuinely different price per tier.

## Why

- Prices had to be "benar-benar fleksibel" per plan. Roles could not express that: Basic is the default tier every guest and unsubscribed member quotes at, which is a membership concept, not a role.
- Basic is mandatory and cannot be removed — a product with no plan price still has to be sellable.

## Files touched

- `src/features/pricing/**`
- `src/features/products/{hooks,pages,services,types,tests}/*`

## Verification

- [x] `npm run test` passes
- [x] `tsc --noEmit` clean
- [x] `npm run lint` clean
- [x] Tokens only, both themes

## Notes / follow-ups

- Nothing deferred.
