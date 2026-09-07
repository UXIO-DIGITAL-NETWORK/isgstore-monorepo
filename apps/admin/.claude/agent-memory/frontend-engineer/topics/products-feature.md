# `products` feature — durable notes

Built 2026-07-28. **Third** roadmap→active promotion (`product_requirements.md §4.6`), same documented-revision pattern as Integration §4.4 and Category §4.5 — never promote silently.

## Shape

Two tabs via `ProductTabsLayout` (clone of `TransactionsLayout`). Segments are `main`/`provider`, following the 2-tab Transactions precedent (`automatic`/`manual`) rather than Categories' spelled-out label-kebab — the labels are qualifiers of the feature name, not standalone nouns. Preview twin at `/admin/products-preview/*`, unguarded, like every feature.

Frames have arrived one round at a time: the list (2026-07-28), then the price breakdown, bulk action bar and row menu, then the **Add form** (2026-07-31). Only the **Product Provider** tab is still frameless and still ships `ProvisionalNotice`.

Service is `list`/`getById`/`create`/`deactivate`/`remove`. `update` still doesn't exist — the Edit form has no frame, and an unused mutation is an unused mutation. **`create` unshifts, it does not push**: 12+ fixtures over a page size of 10 means an appended row lands on page 2, and the Add form redirects to page 1 (Categories pushes only because it has fewer rows than a page).

## Patterns worth reusing

**A header/content mismatch can be the *content* that's wrong — ask, don't rename and move on.** The first Product reference headed a column "Price" and filled it with game names, so it shipped as `Game` (confirmed with the user). The next reference showed what that column was always meant to hold: a per-variant cost/tier price card. The rename was correct for the frame in hand and still had to be reverted — so pin corrections with negative assertions (the test asserted no "Price" column existed), but treat them as revisable, and never let a correction quietly redefine the entity.

**Stacked badges are usually two axes, not one repeated state.** Product renders `status` (`active|inactive`) plus `is_available` (`Available|Unavailable`). Extra badges inside a *different* cell belong to that cell's sub-entity — here, per-variant status. Make fixtures exercise **both values of both axes**, or half the Status column never renders in any test.

**`ProvisionalNotice`** (`features/products/components/ProvisionalNotice.tsx`) — a titled screen plus a dashed "Not designed yet" panel, copy passed in as props. This is Categories' deleted `ProvisionalTabPage` pattern coming back. Two consumers: a tab with no frame, and an Add route whose only job is to keep the primary "+ Add Main Products" button from 404ing. Reach for this instead of either inventing a form or shipping a dead link.

**Table cell thumbnails** — shadcn `Avatar` squared off with `className="size-10 rounded-md"` (a circle reads as a person, not an item) plus `AvatarFallback` with `initials()`. Fixtures leave `image_url` undefined, so there are no broken-image requests and real URLs drop in with zero code change. First table in the repo to render an image.

**Fixture count drives what you can test.** 12 products at a default page size of 10 means page 2 genuinely exists, so the pagination test is real rather than asserting a disabled button.

## Entity

Feature-local snake_case in `types/product.type.ts`, per §6. Product carries a denormalized `game_name` alongside `game_id` because no Game service exists and the real API will join — the Add form has no Game field, so `CATEGORY_OPTIONS` entries carry `game_id`/`game_name` (type `CategoryOption`) and a created product inherits them from its category.

`ProductVariant` is `{id, name, cost_price, prices: Record<PriceTier, number>, status}` — `PRICE_TIERS = ["public","vip","reseller","agent"]`, exported from the type file. There is no flat `price`: the retail number is `prices.public` (what the Variant cell and the price-bucket filter read). Fixtures derive cost and all four tiers from the retail price via a `priced()` helper in `products.data.ts` — **fixture-only math**, the real API returns the five numbers per variant, so nothing in the UI derives a price.

The Add form added optional `sub_name`, `sub_category_name`, `nickname_validation`, `access`, `tag`, `description` — all optional because every fixture predates them and the frame marks no field required.

Inferred and flagged in §4.6, revise when a reference or the API lands:
- The "All Price" filter's options are never shown in the reference (only its closed trigger), so it's modelled as price-range buckets with "All Price" as the clear value.
- The Variant cell's "Fix" prefix reads like a price *type*, but only one value is observable — not modelled as a field.

## Open finding: light-mode success contrast

`text-success` badges measure **2.87:1** at 12px in light mode, under the 4.5:1 the a11y rule requires. **Pre-existing and app-wide, not introduced by products** — `/admin/transaction-preview` in light mode independently measures 3.22:1 (success profit text) and 2.13:1 (warning admin fee). Root cause is the light-mode `--success`/`--warning` values in `src/index.css`, which match what `design_system.md §3` specifies. Dark mode is fine throughout (6.94–17.18:1).

Not fixed unilaterally: darkening a functional-colour token re-themes five features at once and diverges from the documented design system. It's a one-file change when the user approves.

**Measuring contrast in this app needs canvas.** The tokens are `oklch()`, so parsing `getComputedStyle().color` as rgb gives silently wrong numbers. Paint the colour into a 1×1 canvas over the background and read the pixel back.

## Add Main Products form (2026-07-31)

`pages/AddMainProductPage.tsx` — React Hook Form + `zodResolver` + `productForm.schema.ts`, a direct sibling of `AddCategoryPage` (one `divide-y` card of sections, footer buttons outside it, `Box as="form"`). Reuses the promoted `ImageDropzone` + `SelectField` from `components/common`; nothing in `products` imports from `categories`.

- **Layout is 2 / 3 / 3 columns**, not a uniform grid: Product Name + Nickname Validation, then Sub Name + Product Code + Product Access, then Product Tag + Category + Sub Category.
- **The frame was a copy-paste hybrid of Add Category** — header "Add Category", dropzone "Category Logo", "Product Acces" missing an `s`, and "0/280 characters" beside "52% used". Sixth sighting of this defect class in this feature. Corrections are pinned by negative assertions in the test.
- **Required-ness is inferred** (name, code, category) — the frame marks nothing.
- **No pricing fields**, decided with the user: a product created here has **no variants**, so its Variant/Price cells render empty in the list. Do not invent a pricing section; it lands with the variant frame (and with it §5's `cost_price` capture and the Edit form).
- Save is `<Can permission="products.create">`-gated. `AddCategoryPage`'s Save still isn't — fix when that page is next touched.
- Inferred option lists live in `data/select-options.data.ts` and say so in their doc comments: `PRODUCT_ACCESS_OPTIONS` (mirrors `PRICE_TIERS`), `PRODUCT_TAG_OPTIONS`, `SUB_CATEGORY_OPTIONS` (a `Record<categoryName, SelectOption[]>` — the dependent select's source).

## Deferred actions pattern (2026-07-30/31)

Nine entries across the toolbar, selection bar and row menu exist in the references but have no defined effect (Bulk add, Digiflazz, Logo, Digiflazz Update, Show Price, Lock Price, Set Price Limit …). They render, are `<Can>`-gated, and call one local `announceDeferred(message)` helper that raises a `toast.info` naming what the action waits on. **A test asserts they mutate nothing** (`deactivate`/`remove` spies never called, no dialog opens). This beats hiding them (rediscovery cost) and beats guessing a mutation (inventing business rules). Wiring one is a one-line handler swap.
