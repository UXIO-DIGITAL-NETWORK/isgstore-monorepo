# `products` feature — durable notes

Built 2026-07-28. **Third** roadmap→active promotion (`product_requirements.md §4.6`), same documented-revision pattern as Integration §4.4 and Category §4.5 — never promote silently.

## Shape

Two tabs via `ProductTabsLayout` (clone of `TransactionsLayout`). Segments are `main`/`provider`, following the 2-tab Transactions precedent (`automatic`/`manual`) rather than Categories' spelled-out label-kebab — the labels are qualifiers of the feature name, not standalone nouns. Preview twin at `/admin/products-preview/*`, unguarded, like every feature.

Only the Main Products **list** had a reference frame. The Product Provider tab and the Add route ship a `ProvisionalNotice`.

Service is `list`/`getById`/`remove` only — no `create`/`update` until the Add form has a reference. An unused mutation is an unused mutation.

## Patterns worth reusing

**When a reference mislabels a column, rename it for its content — and pin the rename with a negative assertion.** Product's reference heads a column "Price" and fills it with game names, while the actual price sits in the Variant cell. Renamed `Game`; the test asserts *no* column named "Price" exists, so a later copy-paste can't quietly restore the wrong header. Same class as Sub Category's two columns both labelled "Name". **Confirm with the user rather than guessing which side is wrong** — header-vs-content is genuinely ambiguous, and picking wrong bakes a lie into the entity.

**Stacked badges are usually two axes, not one repeated state.** Product renders `status` (`active|inactive`) plus `is_available` (`Available|Unavailable`). Extra badges inside a *different* cell belong to that cell's sub-entity — here, per-variant status. Make fixtures exercise **both values of both axes**, or half the Status column never renders in any test.

**`ProvisionalNotice`** (`features/products/components/ProvisionalNotice.tsx`) — a titled screen plus a dashed "Not designed yet" panel, copy passed in as props. This is Categories' deleted `ProvisionalTabPage` pattern coming back. Two consumers: a tab with no frame, and an Add route whose only job is to keep the primary "+ Add Main Products" button from 404ing. Reach for this instead of either inventing a form or shipping a dead link.

**Table cell thumbnails** — shadcn `Avatar` squared off with `className="size-10 rounded-md"` (a circle reads as a person, not an item) plus `AvatarFallback` with `initials()`. Fixtures leave `image_url` undefined, so there are no broken-image requests and real URLs drop in with zero code change. First table in the repo to render an image.

**Fixture count drives what you can test.** 12 products at a default page size of 10 means page 2 genuinely exists, so the pagination test is real rather than asserting a disabled button.

## Entity

Feature-local snake_case in `types/product.type.ts`, per §6. Product carries a denormalized `game_name` alongside `game_id` because no Game service exists and the real API will join — flagged provisional. `cost_price`/`selling_price` from §6's original brief are deliberately **not** modelled: the list shows one price per variant and no margin, and the form that would capture cost is still roadmap. Add them with that form.

Inferred and flagged in §4.6, revise when a reference or the API lands:
- The "All Price" filter's options are never shown in the reference (only its closed trigger), so it's modelled as price-range buckets with "All Price" as the clear value.
- The Variant cell's "Fix" prefix reads like a price *type*, but only one value is observable — not modelled as a field.

## Open finding: light-mode success contrast

`text-success` badges measure **2.87:1** at 12px in light mode, under the 4.5:1 the a11y rule requires. **Pre-existing and app-wide, not introduced by products** — `/admin/transaction-preview` in light mode independently measures 3.22:1 (success profit text) and 2.13:1 (warning admin fee). Root cause is the light-mode `--success`/`--warning` values in `src/index.css`, which match what `design_system.md §3` specifies. Dark mode is fine throughout (6.94–17.18:1).

Not fixed unilaterally: darkening a functional-colour token re-themes five features at once and diverges from the documented design system. It's a one-file change when the user approves.

**Measuring contrast in this app needs canvas.** The tokens are `oklch()`, so parsing `getComputedStyle().color` as rgb gives silently wrong numbers. Paint the colour into a 1×1 canvas over the background and read the pixel back.
