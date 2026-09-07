# 2026-08-25 — Add Product Provider gets its own page; Main Products filters by real categories

**Scope:** `src/features/products/*`, `src/test/*`
**Type:** feat + fix
**Author/agent:** you

## What changed

### Add Product Provider is a page again
It briefly lived as an in-page panel, which put two tables on one screen showing
overlapping SKU names. That ambiguity was measurable: the tests could not tell the two
apart until the panel was given an `aria-label`, and a person has no such affordance.

- New `src/features/products/pages/PoolCandidatesPage.tsx` — the panel's contents,
  promoted to the page shell used by `MainProductAddBulkPage` / `MainProductPriceLimitPage`
  (header card, content card, bottom-right Cancel + primary action).
- `/admin/products/provider/add` goes from redirect back to a real route, gated on
  `products.create` — the entry button carried that check and the parent route only
  requires `products.view`, so without it the gate would have been lost.
- `ProductTabsLayout` already hides the tab bar for `/add`; no layout change was needed.
- Cancel and a successful add both return to the pool. `usePoolSkus` already invalidates
  the pool list and the summary badge, so the returned-to page is fresh.
- `PoolCandidatesPanel.tsx` deleted; the Add button is a `<Link>` again, badge intact.

### Main Products' Category filter was broken, not just inconsistent
The filter offered a hardcoded list of names ("Mobile Legends: Indonesia", …) that do not
match the real categories ("Mobile Legends"). Worse, `products.service.list()` sent the
chosen name as `search` — and spread it **after** `...rest`, so choosing a category:

1. could not filter (the API's `search` only matches product `name`/`code`), and
2. **wiped out whatever the user had typed** into the search box.

- The toolbar now reads `useProductSelectOptions().categoryOptions` — the same source the
  product form, bulk-add and provider pool already use — and emits a real category id.
- `list()` sends `category_id`, which the API has supported all along
  (`ProductController::index`, `GetProductsAction`).
- Removed the hardcoded `CATEGORY_OPTIONS` (only the toolbar imported it). `PRICE_RANGE_OPTIONS`
  stays — the service depends on it, and price buckets were out of scope.

## Caught while wiring it

**TypeScript did not flag the mismatched param.** `MainProductsPage` built its query object
as a variable, so excess-property checking never ran: `category` stayed as an unknown extra
while `category_id` was simply absent. It compiled cleanly and would have shipped a filter
that does nothing. Renaming the state to `categoryId` is what actually fixed it.

**The fixtures made the filter untestable.** `toApiProduct` hardcoded `category_id: 1` for
all twelve products, so filtering by any category returned everything or nothing. Products
name their game ("Mobile Legends: Bang Bang") while categories name the category
("Mobile Legends"), so a string match was not possible — `CATEGORY_ID_BY_GAME` maps them
explicitly. A "Honkai: Star Rail" category was added because the product fixtures sell its
nominals and it had no category to belong to.

## Verification

- [x] `npm run test` — 82 files, 473 tests, green (also under `CI=1 TZ=UTC`)
- [x] `npx tsc -b --force` clean
- [x] `npm run lint` — 0 errors (10 pre-existing react-compiler warnings)
- [ ] Not exercised against the live API.

## Notes / follow-ups

- Filtering is now stricter: a product whose category does not match is genuinely excluded,
  where before it might have surfaced because its *name* happened to contain the string.
- `features/transactions` still has its own hardcoded `CATEGORY_OPTIONS` — same debt, left
  alone as out of scope.
