# 2026-07-10 — Financial Summary feature

**Scope:** financial (new feature) + StatCard/TrendPill promotion (dashboard → common)
**Type:** feat
**Author/agent:** you (@frontend + @api combined)

## What changed
- Built the `financial` feature: a read-only balance-monitoring summary screen (`/financial`, real; `/finance-preview`, dev-only unauthenticated preview) with a "Financial Summary" header, 3 trend stat cards (Total Credit/Debit/Profit), a Payment Gateway section (Saldo Aktif/Saldo Tertahan per gateway), and a Supplier grid — all balances click-to-copy via a new `CopyableAmount` component (sonner toast confirmation).
- Promoted `StatCard`/`TrendPill` from `src/features/dashboard/components/` to `src/components/common/` (financial is the second consumer, per the reuse-later strategy in `system_architecture.md`). Moved the `StatCardData`/`TrendDirection` type contracts into the promoted components; `dashboard/types/dashboard.type.ts` now re-exports them instead of duplicating, so dashboard fixtures/services/hooks/tests needed no changes beyond two import-path updates.
- Mounted `<Toaster />` in `src/main.tsx` — it was defined (`components/ui/sonner.tsx`) but never rendered anywhere, so no toast (including the new copy-confirmation) could have shown.
- Extended `src/test/setup.ts` with a `navigator.clipboard.writeText` stub (`configurable: true`, since `@testing-library/user-event`'s `setup()` also tries to install its own clipboard stub).
- Corrected `.agents/context/product_requirements.md` §4.2 from its old speculative version (revenue/net-income chart + credit/debit ledger) to match the real Figma/reference design (this is a summary screen only, no chart, no ledger).

## Why
- Financial is MVP-ordered after Dashboard; the reference design is a monitoring summary, not a report builder — built exactly what's shown, no invented ledger/export view.
- Copy scope was narrowed to gateway/supplier balances only (not the 3 aggregate stat cards) per an explicit decision during planning — keeps the shared `StatCard` free of a `copyable` prop/dependency, so the dashboard is untouched by this feature's needs.
- `PaymentGatewayBalance`/`SupplierBalance` types are feature-local (`features/financial/types/`) per product_requirements.md §6 — promote to `src/types/models/` only if another feature needs them.
- **Provisional (do not treat as final):** "Profit" definition (gross vs. net of gateway fees), whether balances are live-polled vs. point-in-time, and whether a deeper ledger/export exists beyond this summary. "Saldo Aktif"/"Saldo Tertahan" kept in Indonesian per the reference (gateway-specific domain terms) — flagged for confirmation, not translated.

## Files touched
- `src/components/common/StatCard.tsx`, `src/components/common/TrendPill.tsx` (new — promoted)
- `src/features/dashboard/components/StatCard.tsx`, `src/features/dashboard/components/TrendPill.tsx` (deleted)
- `src/features/dashboard/types/dashboard.type.ts`, `src/features/dashboard/pages/DashboardPage.tsx` (updated imports)
- `src/features/financial/types/financial.type.ts`
- `src/features/financial/data/{summary-cards,payment-gateways,suppliers}.data.ts`
- `src/features/financial/services/financial.service.ts`
- `src/features/financial/hooks/useFinancial.ts`
- `src/features/financial/components/CopyableAmount.tsx`
- `src/features/financial/pages/FinancialPage.tsx`
- `src/features/financial/index.ts`
- `src/features/financial/tests/{financial.service,FinancialPage}.test.tsx`
- `src/routes/_protected/financial/index.tsx`, `src/routes/_preview/finance-preview/index.tsx` (new)
- `src/routeTree.gen.ts` (regenerated, not hand-edited)
- `src/main.tsx` (Toaster mount)
- `src/test/setup.ts` (clipboard stub)
- `.agents/context/product_requirements.md` (§4.2 correction)

## Verification
- [x] Built TDD-first: test cases defined, failing tests written (confirmed failing for the right reason — route not found), then implemented to green
- [x] `npm run test` passes (49/49 across 9 files, incl. dashboard tests after the promotion)
- [x] `npx tsc --noEmit` clean
- [x] `npm run lint` clean for all touched/new files (10 pre-existing errors elsewhere in the repo — `components/ui/*`, `dashboard/DataTable.tsx` — predate this change, confirmed via `git status`)
- [x] `/qa-audit` run — PASS with one High finding (missing this log entry, resolved by this file) and one Low (stat-cards section lacked an error/retry state vs. the other two sections — fixed to match)
- [x] Renders in **both** light and dark (verified via chrome-devtools screenshots of `/finance-preview`)
- [x] Reconciled against the reference image (Figma MCP access unavailable in this session — file owner permission denied); layout, stat-card trend-pill style (Profit uses the same pill as Total Credit), gateway row, and supplier grid all matched 1:1
- [x] `/finance-preview` renders the full page with no auth state (dev-only, blocked via `import.meta.env.PROD` in `_preview.tsx`)
- [x] `/financial` still requires auth — confirmed via browser navigation (redirects to `/login`) and a route-level test

## Notes / follow-ups
- Swap `financial.service.ts` method bodies to real `api.get(...)` calls once the backend ships — hooks/UI stay unchanged.
- Figma reconciliation was done against the provided reference image only; re-check against the live Figma frame once file access is available.
- "Profit" definition, live-vs-point-in-time balances, and any deeper ledger/export remain open decisions per product_requirements.md §4.2.
