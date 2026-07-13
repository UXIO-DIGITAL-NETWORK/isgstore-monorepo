# 2026-07-13 — Make design-preview routes reachable in built bundles

**Scope:** setup — `/_preview` route group
**Type:** fix
**Author/agent:** you (main)

## What changed
- `src/routes/_preview.tsx`: removed the `beforeLoad` guard that threw `notFound()` whenever
  `import.meta.env.PROD` was true. The `/_preview/*` screens (dashboard-preview,
  finance-preview, integration-preview, categories-preview + its sub-routes,
  transaction-preview) are no longer gated by build mode.

## Why
- The route was originally gated "so it's inert in production" (see prior comment), but the
  project has no separate staging build mode — `npm run build` sets `import.meta.env.PROD = true`
  for both staging and production deploys, so the guard also hid preview screens from staging.
  User asked explicitly to make the preview routes visible on the deployed staging build.
- Confirmed no other route relies on this build-mode check (`grep` for
  `import.meta.env.PROD`/`notFound` in `src/routes` returns only this file, now removed).

## Files touched
- `src/routes/_preview.tsx`

## Verification
- [x] `npm run lint` — 0 errors
- [x] `npx tsc --noEmit` — clean
- [x] `npm run build` — succeeds; confirmed `dist`/`routeTree.gen.ts` still registers all
  `/_preview/*` routes after the change
- [x] `npm run test` — unaffected (no test covers this route group)

## Notes / follow-ups
- The route group remains unauthenticated by design (no `requireAuth`) — it is now reachable on
  any deployed build, staging included, without login. If staging becomes externally reachable
  (not behind a VPN/basic-auth wall) this exposes mock-data design screens to anyone with the
  URL. Flagging since this is a real behavior change from "prod-only inert" to "always visible" —
  no action taken beyond what was asked.
