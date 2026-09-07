# 2026-07-10 — Integration feature

**Scope:** integration (new feature) + StatCard icon/plain-caption variant (common) + topbar breadcrumb
**Type:** feat
**Author/agent:** you (@frontend + @api combined)

## What changed
- Built the `integration` feature: a connectivity-monitoring screen (`/integration`, real; `/integration-preview`, dev-only unauthenticated preview) — header + subcopy, 3 overview stat cards (Total Channels/Active/Disconnected), a 5-option category segmented control (All/Supplier/Payment Gateway/Whatsapp Gateway/Email Gateway), and a channel card grid with a connection-status badge, a balance badge, and a row-level kebab menu, all polling on a 30s interval (`refetchInterval`, per `system_architecture.md §4.9` — connectivity has no terminal state, so no stop condition).
- Extended `src/components/common/StatCard.tsx` with an optional leading `icon` + `format: "count"` variant and made `deltaPct`/`direction` optional, instead of building a second card component. Backward-compatible: dashboard/financial's existing trend-pill usage is unchanged (verified via the full test suite).
- Fixed `DashboardNavbar`'s topbar title, previously hardcoded to the literal string `"Dashboard"` on every screen (including `/financial`) — replaced with a `pathname → title` lookup (mirrors the sidebar's own `useLocation`-driven active-nav pattern), so `/integration` (and `/financial`) now show their own name instead of always "Dashboard".
- Activated the sidebar's "Integration" link (`DashboardSidebar.tsx`), previously a `/dashboard` placeholder set before this feature existed — now points at `/integration`, which also fixes the ⌘F command-palette entry for it.
- `IntegrationChannel` is a new feature-local, snake_case entity (`types/integration.type.ts`) — deliberately **not** merged with financial's camelCase `PaymentGatewayBalance`/`SupplierBalance`, even though some names overlap (e.g. "UxioPay"): financial tracks money, this tracks connectivity, per `product_requirements.md §4.4`/`§6`.

## Why
- **Integration was promoted from roadmap to active scope** in this session's revision of `product_requirements.md §4.4` (2026-07-10) — this build is that promotion's first implementation, not a roadmap speculative build.
- Two reference-image artifacts were deliberately not copied: the breadcrumb read "Financial" (leftover from copying the Financial Figma frame — fixed to "Integration" via the navbar change above) and all 5 channel cards showed identical "Digiflazz Buyer" placeholder data (replaced with varied fixtures below).
- **Provisional / flagged, not asserted as confirmed:**
  - The 7 channel fixtures (4 Supplier: Digiflazz Buyer, Digiflazz Seller, Zelpoint, Topupkuy; 2 Payment Gateway: UxioPay, Monetapay; 1 Whatsapp Gateway: Wablas) intentionally **omit UxioTopup**, financial's 5th supplier — it reads as the platform's own in-house brand, plausibly needing no external integration channel. This is a plausible reconciliation, not an asserted fact.
  - **Monetapay** was added as the 2nd payment gateway alongside UxioPay — a cross-project assumption (the consumer platform's established gateway, related products) — not confirmed against this admin's own scope.
  - The row-kebab menu items (Ping/refresh now, Edit connection, View details) are a sensible inferred default — no reference shows the menu open, so the exact item set isn't confirmed. All three are inert `sonner` toast stubs this phase (no backend to mutate against).
  - No Figma node ID is documented for Integration (`design_system.md §11` covers Dashboard only), and Figma MCP file access was denied this session (no editor permission on file `l7izBcDr0PtS2FUdMdHFk3` — same as the prior Financial build) — reconciliation was done against the provided reference image + live chrome-devtools screenshots only, not the Figma frame itself.

## Files touched
- `src/features/integration/types/integration.type.ts`
- `src/features/integration/data/channels.data.ts`
- `src/features/integration/services/integration.service.ts`
- `src/features/integration/hooks/useIntegration.ts`
- `src/features/integration/components/ChannelCard.tsx`
- `src/features/integration/pages/IntegrationPage.tsx`
- `src/features/integration/index.ts`
- `src/features/integration/tests/{integration.service,IntegrationPage}.test.tsx`
- `src/components/common/StatCard.tsx` (extended, backward-compatible)
- `src/features/dashboard/components/DashboardNavbar.tsx` (breadcrumb fix)
- `src/features/dashboard/components/DashboardSidebar.tsx` (Integration href fix)
- `src/routes/_protected/integration/index.tsx`, `src/routes/_preview/integration-preview/index.tsx` (new)
- `src/routeTree.gen.ts` (regenerated via `vite build`, not hand-edited)

## Verification
- [x] Built TDD-first: test cases defined, failing tests written (confirmed failing for the right reason — unresolved module imports for the not-yet-built service/fixtures), then implemented to green
- [x] `npm run test` passes (89/89 across 16 files, incl. dashboard/financial tests after the `StatCard`/navbar/sidebar edits — no regression)
- [x] `npx tsc --noEmit` clean
- [x] `npm run lint` clean for all touched/new files (8 pre-existing errors + 3 pre-existing warnings elsewhere — `components/ui/*`, `DataTable.tsx`, `transactions/**` — predate this change, confirmed via `git status`)
- [x] `/qa-audit` run — PASS with 2 Low findings: missing `tabular-nums` on the channel balance badge (fixed), and no dedicated `StatCard.test.tsx` unit test for the two new render branches (accepted — both are exercised through `IntegrationPage.test.tsx`'s real assertions, not superficial "renders" checks)
- [x] Renders in **both** light and dark (verified via chrome-devtools screenshots of `/integration-preview` and the real `/integration` route with a fake auth cookie)
- [x] Reconciled against the reference image (Figma MCP access unavailable — file owner permission denied, same as the prior Financial build); layout, stat-card icon+caption style, category filter, channel-card badge row, and grid all matched 1:1. Row-menu items and the 2nd payment-gateway/UxioTopup-omission assumptions above could **not** be checked against anything concrete beyond the reference image and PRD — genuinely unconfirmed, not just unchecked.
- [x] `/integration-preview` renders the full page with no auth state (dev-only, blocked via `import.meta.env.PROD` in the shared `_preview.tsx`)
- [x] `/integration` still requires auth — confirmed via browser navigation (redirects to `/login` with no cookie) and inherits `requireAuth` from `_protected.tsx`'s `beforeLoad`
- [x] Sidebar "Integration" link confirmed pointing at `/integration` (was `/dashboard`), active-highlighted correctly when on that route

## Notes / follow-ups
- Swap `integration.service.ts`'s method body to a real `api.get(...)` call once the backend ships — hooks/UI stay unchanged.
- Re-check against the live Figma Integration frame once file access is available; in particular confirm the row-kebab menu items and the Monetapay/UxioTopup assumptions against the real design, not just this build's inference.
- Polling interval (30s) is a reasonable default, not a confirmed spec value — adjust once real ping-latency/backend guidance exists. A fake-timers test asserting the query re-fires on interval was considered but skipped as likely brittle for this pass; the polling behavior itself (`refetchInterval` wired on `useChannels`) is covered by code review, not a dedicated timer test.
