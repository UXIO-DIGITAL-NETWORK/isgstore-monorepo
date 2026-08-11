# 2026-08-11 — Integration: edit connection, view details, ping

**Scope:** integration feature (channel card menu + modals)
**Type:** feat
**Author/agent:** you

## What changed
- Wired the channel card ⋮ menu (was toast stubs): **Ping / refresh now** (mutation),
  **Edit connection** (dynamic modal), **View details** (read-only modal).
- New `EditConnectionDialog` — a dynamic RHF form built from the provider's credential
  field schema returned by the API; secrets are password inputs, blank by default and
  only sent when a new value is typed (write-only).
- New `ViewDetailsDialog` — status / balance / mode / endpoint / last-ping + masked
  credential values + a "Ping now" button.
- Service + hooks: `getChannelDetails`, `updateChannel`, `pingChannel`;
  `useChannelDetails`, `useUpdateChannel`, `usePingChannel`. Channel type gains
  `provider` + `mode`.
- Edit item gated with `<Can permission="integration.manage">`.

## Why
- Backend now exposes `GET/PUT /v1/integration/channels/{provider}` and
  `POST .../ping`, with credentials DB-backed (encrypted) + `.env` fallback and secrets
  returned masked. The Monetapay "disconnected" bug was a backend balance-parse fix; the
  UI here makes credentials editable so a future disconnect is fixable without a redeploy.

## Files touched
- `src/features/integration/{types/integration.type.ts,services/integration.service.ts,hooks/useIntegration.ts}`
- `src/features/integration/components/{ChannelCard,EditConnectionDialog,ViewDetailsDialog}.tsx`
- `src/features/integration/tests/{integration.manage.service,EditConnectionDialog}.test.tsx`

## Verification
- [x] Built with colocated tests (service + dialog); `npm run test` passes (426)
- [x] `tsc -b` + eslint clean; `vite build` clean
