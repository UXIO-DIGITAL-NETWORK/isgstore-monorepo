# 2026-08-03 — Add Product: Pricing & Margin + Product Mix sections

**Scope:** products / Add Main Products form (`/admin/products/main/add`)
**Type:** feat
**Author/agent:** you

## What changed

- Two new sections below "Media & description", each its own `rounded-2xl` card with a gap, as the supplied frame draws them (the two existing sections stay `divide-y` siblings inside their shared card).
- **Pricing & Margin** — "Cost price and selling price per user segment." Seven fields in one `sm:grid-cols-3` grid: Points and Discount (trailing `%` addon), then Cost Price, Public Price, VIP Price, Reseller Price, Agent Price.
- **Product Mix** — "Combine supplier products into one bundled price." Right-aligned `+ Add Mix` button over a `useFieldArray` list; empty state reads "No product mix yet." verbatim from the frame. Each row is Supplier Product (select) + Quantity + a remove button.
- New `ProductMixBuilder` component, new `SUPPLIER_PRODUCT_OPTIONS` fixture, seven new schema fields plus a `productMix` array.
- First use of the already-installed `InputGroup` primitives (`src/components/ui/input-group.tsx`) — previously unused — for the `%` suffix.

## Why

- The Add form had no pricing at all; its header comment said so explicitly. The new frame supplies it.
- **Payload deliberately unchanged (provisional).** `onSubmit` still sends `variants: []`. `Product` (§6) has no field for points, a discount, or a bundle, and nothing in the frame says a single price row is a `ProductVariant` — so the form validates these values and drops them rather than inventing an entity shape. Mapping lands with the API contract.
- Money and percentages stay **strings** in the schema, like every other field on this form. `z.coerce.number()` turns an empty optional field into `0`, which would read as "priced at zero" rather than "not filled in".
- The mix **row** (supplier + quantity) is inferred — the frame only shows the empty state and the button. Flagged in the component's doc comment. `SUPPLIER_PRODUCT_OPTIONS` is likewise inferred; no supplier fixture exists yet (Product Provider is still a `ProvisionalNotice`).
- The frame draws a leading search icon inside every input; the two shipped sections above already drop it on plain fields, so it is dropped here too.

## Files touched

- `src/features/products/pages/AddMainProductPage.tsx`
- `src/features/products/components/ProductMixBuilder.tsx` (new)
- `src/features/products/schemas/productForm.schema.ts`
- `src/features/products/data/select-options.data.ts`
- `src/features/products/tests/AddMainProductPage.test.tsx`

## Verification

- [x] Built TDD-first: tests extended/added first, 7 failing, then implemented to green
- [x] `npm run test` passes — 52 files, 363 tests
- [x] `npx tsc -b --force` clean (root `--noEmit` checks 0 files in this solution-style config)
- [x] `npm run lint` clean — 0 errors (7 pre-existing React Compiler warnings on TanStack Table)
- [ ] `/qa-audit` run (findings in `.artifacts/qa-log.md`)
- [x] Renders in **both** light and dark — verified by reading computed styles off the live page in each theme (card `oklch(1 0 0)` → `oklch(0.205 0 0)`, border `0.922` → `0.269`, muted text `0.556` → `0.708`, all chroma 0, no hardcoded colours). Screenshots could not be captured — `chrome-devtools take_screenshot` hangs in this environment; the a11y snapshot and computed styles stood in.
- [x] Reconciled against the supplied frame

## Notes / follow-ups

- Wire the pricing fields and mix rows into the payload once §6 gains fields for them — the `ponytail:` comment on `variants: []` marks the seam.
- Replace `SUPPLIER_PRODUCT_OPTIONS` with real data when a Product Provider service lands.
- The frame titles the section "Pricing & Margin"; the request said "Price & Margin". The frame won.
