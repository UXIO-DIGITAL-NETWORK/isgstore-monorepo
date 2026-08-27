# 2026-08-27 — Remove the dead "coming soon" scaffolding

**Scope:** products, home, content
**Type:** chore
**Author/agent:** you

## What changed
- Deleted `src/features/products/components/ProvisionalNotice.tsx` (the "Not designed yet"
  component).
- Deleted the entire `src/features/home` slice (7 files).
- `ContentTabsLayout` no longer branches on a `/admin/content-preview` base.

## Why
- `ProvisionalNotice` had **zero importers**: its two historical consumers (the Product
  Provider tab and the Add Main Products route) are both fully built now. It was the only
  file in the app whose purpose was rendering a "coming soon" state.
- `features/home` had zero references — `routes/index.tsx` unconditionally redirects to
  the dashboard or to login, so the landing page it contained was unreachable.
- `PREVIEW_BASE = "/admin/content-preview"` was copy-pasted from the Categories/Products
  layouts; no such route exists in the route tree, so the branch could never be taken.

## Files touched
- removed: `src/features/products/components/ProvisionalNotice.tsx`, `src/features/home/**`
- `src/features/content/layouts/ContentTabsLayout.tsx`

## Verification
- [x] Grepped for references before deleting — all three were unreferenced
- [x] `npm run test` passes
- [x] `npx tsc -b --force` clean
- [x] `npm run lint` clean

## Notes / follow-ups
- **`/admin/_preview/*` is still reachable without authentication in production builds**
  (`src/routes/admin/_preview.tsx` has no `import.meta.env.PROD` guard, unlike
  `error-preview`), exposing 15 admin screens. Out of scope for this change, but it is a
  real finding and should be closed separately.
