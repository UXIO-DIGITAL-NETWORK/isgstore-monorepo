# 2026-07-25 — Edit Transaction: modal → dedicated page

**Scope:** transactions — Edit Transaction (manual status override)
**Type:** refactor
**Author/agent:** @frontend

> **This REPLACES the modal-based implementation — it does not add a second way to edit a transaction.**
> `EditTransactionDialog.tsx` is deleted, not deprecated. After this change there is exactly one
> Edit Transaction surface: the route below.

## What changed

- **New nested route**, first dynamic segment in the app (`$invoiceNo`), registered in three places so
  the shared `RowActionMenu` resolves from wherever it's rendered:
  - `/admin/transactions/automatic/$invoiceNo/edit`
  - `/admin/transactions/manual/$invoiceNo/edit`
  - `/admin/transaction-preview/$invoiceNo/edit` (unauthenticated preview mirror)
- **`EditTransactionForm`** — the four fields (Status Payment, Invoice Status, Serial Number, Invoice
  Proof) lifted out of the modal unchanged, minus all Dialog chrome. The card is the `<form>` element,
  with Cancel/Save at its bottom-right per the reference.
- **`EditTransactionPage`** — header card + form card, single column. Loading skeleton and a
  not-found state with a way back (direct URL entry is a real path now).
- **`RowActionMenu`** — "Edit Invoice" navigates instead of opening a dialog. The href is derived from
  the current pathname (`${pathname}/${invoice_no}/edit`), the same trick as `CategoryToolbar`'s
  "+ Add Category", so preview and Manual work with no special-casing.
- **`TransactionsLayout`** — hides the Automatic/Manual tabs on `/edit`, mirroring
  `CategoryTabsLayout`'s existing `onAddRoute` hatch.
- **`DashboardNavbar`** — added `getTransactionBreadcrumb`; the topbar now renders
  `Transaction › Automatic › Edit Transaction`. Side effect: the transaction list screens gained a real
  two-crumb trail (they showed a flat "Transaction", and the preview showed "Dashboard"). The now-dead
  `"/admin/transactions"` entry was removed from `PAGE_TITLES`.
- **`transactionsService.getById`** — widened to match `id` **or** `invoice_no`, so the route can be
  invoice-addressable without a second lookup method.
- **Deleted:** `src/features/transactions/components/EditTransactionDialog.tsx`.

## Why

- `product_requirements.md §4.3` was revised 2026-07-13: Edit Transaction is a real nested route, not
  modal state. The reference's breadcrumb confirms it.
- **URL carries `invoice_no`, not `id`** (confirmed with the user): human-meaningful and shareable, and
  it matches the `$invoiceNo` segment name the PRD specifies.
- **Manual tab mirrored** (confirmed with the user): `RowActionMenu` is shared by both tables, so
  without the mirror the Manual tab's "Edit Invoice" would 404 — a regression against today's working
  dialog.
- **Fields extracted into their own component** (confirmed with the user) rather than inlined in the
  page, so a future Manual-specific or detail-screen reuse doesn't have to unpick the page.
- Two reference artifacts were **not** built as drawn, both consistent with earlier calls:
  - Subcopy "Lorem Ipsum Dolor Sit Amet." is placeholder — the modal's existing real copy was kept.
  - "Serial Number" renders as a select showing the literal word "Text". This is the **second**
    independent reference showing the same artifact, so it stays a plain text input.
- The modal's reset-on-open effect was dropped: it existed because the dialog was mounted once per
  table row and outlived its open state. A route mounts fresh, and the page keys the form by
  transaction id.

## Files touched

- `src/routes/admin/_protected/transactions/automatic/$invoiceNo/edit/index.tsx` (new)
- `src/routes/admin/_protected/transactions/manual/$invoiceNo/edit/index.tsx` (new)
- `src/routes/admin/_preview/transaction-preview/$invoiceNo/edit/index.tsx` (new)
- `src/routeTree.gen.ts` (regenerated)
- `src/features/transactions/pages/EditTransactionPage.tsx` (new)
- `src/features/transactions/components/EditTransactionForm.tsx` (new)
- `src/features/transactions/components/EditTransactionDialog.tsx` (**deleted**)
- `src/features/transactions/components/RowActionMenu.tsx`
- `src/features/transactions/layouts/TransactionsLayout.tsx`
- `src/features/transactions/services/transactions.service.ts`
- `src/features/transactions/index.ts`
- `src/features/dashboard/components/DashboardNavbar.tsx`
- `src/features/categories/components/CategoryImageUpload.tsx` (stale comment reference)
- `src/features/transactions/tests/EditTransactionPage.test.tsx` (new, 8 cases)
- `src/features/transactions/tests/AutomaticTransactionsPage.test.tsx`
- `src/features/transactions/tests/transactions-routes.test.tsx`

## Verification

- [x] Built TDD-first: tests adapted/written first, confirmed failing (11 red, all "route/page does not
      exist"), then implemented to green
- [x] `npm run test` passes — 27 files, 154 tests
- [x] `npx tsc -b --force` clean — **not** `tsc --noEmit`, which checks 0 files against this
      solution-style root tsconfig and passes vacuously
- [x] `npm run lint` clean — 0 errors; warning count unchanged at 5 (the react-hook-form
      React-Compiler notice moved from the deleted modal to the new form)
- [ ] `/qa-audit` not run this change
- [x] Renders in **both** light and dark (chrome-devtools, `/admin/transaction-preview/…/edit`);
      no console errors or warnings
- [x] Breadcrumb reads `Transaction › Automatic › Edit Transaction`; tabs hidden on the edit route
- [x] Click-through verified in the browser from the preview table — lands on that row's own URL with
      that row's values prefilled (Pending/Pending, not the previously-viewed row's Success/Success).
      The authed Automatic and Manual routes are covered by `transactions-routes.test.tsx`; they were
      not exercised in a live logged-in browser session.
- [ ] Figma frame not re-reconciled (built from the supplied flat reference image)

## Notes / follow-ups

- `getById` matching either key is a mock-layer convenience (`ponytail:` comment in place). When the
  backend lands, `GET /transactions/{ref}` decides whether the ref is an id or an invoice number.
- The Invoice Proof dropzone still only carries the `File` through `FormData`; there is no upload
  endpoint yet (`system_architecture.md §4.9`, no S3 this phase).
- `EditTransactionForm` is the third would-be consumer of the dropzone pattern that
  `CategoryImageUpload` flagged. Still two separate copies — promote to `components/common` if a
  fourth appears.
