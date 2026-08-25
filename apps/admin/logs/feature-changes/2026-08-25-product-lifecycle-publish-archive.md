# 2026-08-25 — One product lifecycle: Publish/Unpublish, a pool that empties, Archive

**Scope:** products — Main Products list + Product Provider (pool)
**Type:** feat
**Author/agent:** you

## What changed
- **Activate/Deactive → Publish/Unpublish.** The row menu's lifecycle item now
  moves both halves of "sellable" through `POST /v1/products/bulk/publish`.
  Blocked publishes are disabled with the server's own reason inside the item
  (same pattern as the pool's Promote), and the toolbar's bulk `Deactive` became
  `Unpublish`.
- **Status badge reads `publish_state`**, not `status`: Draft / Published /
  Unpublished / Archived. A new Status filter in the toolbar is the only way to
  reach archived rows.
- **Delete → Archive.** Copy no longer claims it cannot be undone, because it
  can: an archived row keeps its order history and comes back through Restore,
  which is the only item an archived row's menu offers.
- **The pool stops showing promoted SKUs.** `Publish` is gone from
  `ProviderRowActions` — the row is not there any more once promoted — replaced
  by **Promote & Publish**, and the "Pipeline stage" filter dropped its now-empty
  Draft and Published options.
- Publish/unpublish/archive invalidate `["supplier-products"]` as well as
  `["products"]`; a lifecycle change moves rows in both lists.

## Why
- `status` is only half of what makes a product sellable — the other half is an
  active supplier mapping — so "Activate" could report a product as live that the
  storefront could not see, and this screen had no second verb to finish the job.
- A promoted SKU appearing in both lists made "where does this product live?"
  unanswerable, and stranded a Publish action on a row the admin had moved past.
- Deleting a product that had ever sold was impossible: `transactions.product_id`
  is RESTRICT and the QueryException was uncaught, so the admin got a bare 500.

## Files touched
- `src/features/products/components/{ProductRowActions,ProviderRowActions,ProductStatusBadge,MainProductToolbar,mainProductColumns}.tsx`
- `src/features/products/pages/{MainProductsPage,ManagedProviderPage}.tsx`
- `src/features/products/hooks/{useProducts,useProviderPool}.ts`
- `src/features/products/services/{products,providerPool}.service.ts`
- `src/features/products/types/product.type.ts`
- `src/features/products/tests/*` and `src/test/{fakeApi.ts,fixtures/products.data.ts}`

## Verification
- [x] Built TDD-first: test cases defined, failing tests written, then implemented to green
- [x] `npm run test` passes (483 tests, 82 files)
- [x] `npx tsc -b --force` clean
- [x] `npm run lint` clean (0 errors; the 10 pre-existing React Compiler warnings remain)
- [ ] `/qa-audit` run — not run
- [ ] Renders in **both** light and dark — not visually verified
- [ ] Reconciled against Figma frame — n/a, no frame for these states

## Notes / follow-ups
- The API side landed with this: `products.deleted_at`, `PublishProductAction`,
  `UnpublishProductAction`, `RestoreProductAction`, a pooled-by-default
  `GET /v1/supplier-products`, and `POST /v1/supplier-products/bulk/promote-publish`.
  610 API tests pass.
- `Transaction::product()` is declared `withTrashed()` on the API. Without it
  `ProductResource` — which dereferences `$this->id` straight through — would 500
  the admin transaction list and the dashboard on an archived product.
- Bulk Publish does not exist on Main Products, only bulk Unpublish: a selection
  can hold rows in any state, so there is no single one to invert. Publishing many
  at once is what the pool's Promote & Publish is for.
