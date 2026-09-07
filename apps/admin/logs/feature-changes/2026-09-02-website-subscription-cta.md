# 2026-09-02 — Website subscription expiry + renewal CTA in the sidebar

**Scope:** `dashboard` (sidebar footer)
**Type:** feat
**Author/agent:** you

## What changed

- `WebsiteSubscriptionCard` in a new `SidebarFooter`: the client's own subscription end date, days remaining, and a deep link to the Uxiolabs Pay checkout.
- `useWebsiteSubscription` / `websiteSubscription.service.ts`; `fakeApi` seeds the endpoint since the card mounts on every admin route.

## Why

- `SidebarFooter` existed in the primitives but had never been imported; the card sits below the nav so it is the last thing an admin sees.
- The collapsed (`collapsible="icon"`) state uses the file's existing `group-data-[collapsible=icon]:hidden` utility rather than branching on `state` manually.
- The `checkout_url` is built server-side — only the API knows the service id — so the panel needs no new env var.

## Files touched

- `src/features/dashboard/{components,hooks,services,tests}/*`
- `src/test/fakeApi.ts`

## Verification

- [x] `npm run test` passes (render tests for both the expanded and collapsed sidebar)
- [x] `tsc --noEmit` clean
- [x] `npm run lint` clean
- [x] Both themes

## Notes / follow-ups

- The link lands on the Uxiolabs Pay **login** page, because the target route is behind `requireAuth` + `requirePaymentAdmin`. The copy says "Perpanjang di Uxiolabs Pay" with an external-link icon so that is not a surprise.
