# 2026-07-31 — Marketing and Administration modules (the last disabled sidebar entries)

**Scope:** `src/features/marketing` (new), `src/features/administration` (new), `src/features/content` (two tabs added), sidebar
**Type:** feat
**Author/agent:** @frontend + @api

## What changed

| Module | Route | Endpoint |
|---|---|---|
| Banners | `/admin/content/banners` | `/v1/banners` |
| Announcements | `/admin/content/announcements` | `/v1/announcements` |
| Promo | `/admin/promos` (+ add/edit) | `/v1/promos` |
| Flash Sale | `/admin/flash-sales` | `/v1/flash-sales` |
| Payment | `/admin/payments` | `/v1/payment-channels` |
| Users | `/admin/users` | `/v1/users` |
| Settings | `/admin/settings` | `/v1/settings` |

Sidebar: **Promo**, **Flash Sale** and **Payment** are no longer `disabled`, and a new **Administration** group carries Users and Settings. Every previously-disabled entry now points at a real screen.

## Decisions worth recording

- **Banners and announcements became content tabs, not their own features.** They are storefront copy managed the same way as articles, so they reuse `ContentToolbar`, `ContentRowActions` and `ContentListShell` rather than forking them.
- **`marketing` and `administration` are separate features with their own copies of the shared list components.** Importing `content`'s components across the feature boundary would break the isolation rule; three small copies is what the rule costs, and it is cheaper than promoting them before a third consumer proved the shape.
- **Flash sale status is three states, not two.** `is_active` alone cannot distinguish scheduled from running from over, so the column reads Running / Scheduled / Inactive off the API's `is_running` flag.
- **Promo visibility is its own column.** `is_public` controls advertising, not usability — a private code still works when typed. Labelling it "Active/Inactive" would have implied otherwise.
- **Settings is a grouped form with one bulk save**, not a table — every value is edited together and written in one request. Image-typed settings are shown read-only because they are written by the upload endpoint.
- **Users is read-only.** The API exposes full CRUD, but editing a member's balance moves money and belongs behind its own audited flow (the wallet ledger), not a free-text field in a table.
- **The settings draft is derived, not effect-seeded.** State holds only the keys the admin has touched; everything else reads through to the saved value. That avoids the `set-state-in-effect` lint error and means a background refetch cannot clobber an in-progress edit.

## API additions

`image_url` added to `BannerResource` and `AnnouncementResource` — the admin renders these images, and the raw storage path alone is not renderable.

## Files touched

- `src/features/marketing/**` (new — types, 2 services, 2 hook files, schema, 3 components, 3 pages, barrel)
- `src/features/administration/**` (new — types, service, hooks, 3 pages, barrel, tests)
- `src/features/content/**` — banner/announcement types, service, 2 hook files, columns, 2 list pages, 2 form pages, tabs, barrel
- `src/routes/admin/_protected/{promos,flash-sales,payments,users,settings,content/banners,content/announcements}/**`
- `src/features/dashboard/components/DashboardSidebar.tsx`
- `src/test/fakeApi.ts`
- (API) `BannerResource`, `AnnouncementResource`

## Verification

- [x] `npm run test` — 57 files, 360 tests (9 new route tests, green first run)
- [x] `npx tsc -b --force` clean
- [x] `npm run lint` — 0 errors (8 pre-existing warnings)
- [x] `npm run build` succeeds; route tree regenerated
- [x] Feature isolation holds — no new cross-feature imports
- [x] All 7 endpoints verified live (HTTP 200)
- [x] Settings bulk save round-trip: saved via admin → **storefront's public settings endpoint reflected it immediately** → restored
- [x] Promo create → **appeared in the storefront's public voucher list** → deleted
- [x] Payment-channel delete guard verified by attaching a transaction first: "This channel has transactions and cannot be deleted."
- [ ] `/qa-audit` run
- [ ] Figma reconciliation — **no frames exist for these screens**; layout follows the categories feature's card/tab structure

## Notes / follow-ups

- Flash sale has no add/edit form yet — the list and the API's nested item sync are in place, but the master-detail editor (a sale plus its product line-up) is its own screen.
- Payment channels are list-only; the service has `update`, so an edit form is a form-page away.
- Users could gain a detail view (transaction history, wallet ledger) — the ledger endpoint already exists at `/v1/me/balance-mutations` and would need an admin-scoped twin.
