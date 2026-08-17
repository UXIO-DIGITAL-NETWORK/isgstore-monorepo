# 2026-08-17 — Payment channels page made read-only

**Scope:** administration / Payment channel list (`PaymentChannelListPage`)
**Type:** refactor
**Author/agent:** you

## What changed
- Removed the row **Action** menu (Edit / Activate-Deactivate / Delete), the bulk
  row-selection checkboxes, and the bulk-delete confirm dialog from the Payment page.
  The table is now display-only (No., Channel, Type, Fee, Minimum, Status).
- Updated the page description (dropped the "deactivate it instead" note) to
  "Channels offered at checkout, shown here for reference."
- Deleted the now-orphaned `PaymentChannelRowActions.tsx`, `EditPaymentChannelDialog.tsx`,
  and its test.
- Replaced the obsolete "deactivates a channel" route test with a read-only assertion
  (no action menu, no checkboxes); added a colocated `PaymentChannelListPage.test.tsx`.

## Why
- Product decision: the admin Payment channel list should be read-only — no edit,
  delete, or deactivate. The mutation hooks (`useUpdatePaymentChannel`,
  `useDeletePaymentChannels`) and service methods are left in the data layer, unused,
  in case the capability is re-exposed later.

## Files touched
- `src/features/administration/pages/PaymentChannelListPage.tsx`
- `src/features/administration/pages/PaymentChannelListPage.test.tsx` (new)
- `src/features/administration/tests/administration-routes.test.tsx`
- removed: `src/features/administration/components/PaymentChannelRowActions.tsx`,
  `EditPaymentChannelDialog.tsx`, `EditPaymentChannelDialog.test.tsx`

## Verification
- [x] Built TDD-first: obsolete test updated to the new read-only spec, new page test added
- [x] `npm run test` passes (administration suite green)
- [x] `npx tsc -b --force` clean
- [x] `npm run lint` clean (0 errors; pre-existing useReactTable warnings only)
- [ ] `/qa-audit`
- [x] Tokens-only, unchanged table styling — renders in both light and dark

## Notes / follow-ups
- `paymentChannelsService.update`/`remove` + their hooks are now unused; remove if the
  read-only decision is permanent.
