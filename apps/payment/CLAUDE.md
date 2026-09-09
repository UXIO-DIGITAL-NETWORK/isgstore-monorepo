# CLAUDE.md — Uxio Payment Page

Master brief for Claude Code in this repo. This file is the spec — the `.agents/`/`.claude/` layer it was
written against was never carried over (see "Authoritative documents").

## What this is

The **payment page** SPA for Uxio — a merchant-settlement dashboard on top of the
existing top-up platform, modelled on FastQR/Monetapay. It serves **two roles from one
app**, chosen by the signed-in user's role name (the values are the API's
`App\Enums\RoleType` cases, lower-cased):

- **`payment-internal`** = "kita" (platform operator): every merchant, all transactions, the
  platform's own profit balance, and withdrawal approval.
- **`payment-admin`** = "client" (merchant): its own balance, transactions, mutasi
  (ledger), and withdrawal requests.

It was scaffolded from the admin dashboard repo (`uxiotopup-admin`, formerly
`web-admin-topup-fe`) and deliberately mirrors its structure, config, and conventions.
It talks to the **same** Laravel API as the storefront and admin (`uxiotopup-api`), under
the `/v1/payment-admin/*` (merchant) and `/v1/payment-internal/*` (kita) route groups;
deploy behind a subdomain.

**Monochrome** (shadcn `neutral`), **Inter**, **light + dark (dark default)**. Stack:
**React 19 + Vite + TypeScript (strict) + Tailwind v4 + shadcn/ui (`new-york`) + TanStack
Router/Query/Table + Zustand + React Hook Form + Zod + Axios + sonner + next-themes**.
Testing: **Vitest + React Testing Library**.

## Authoritative documents

**This repo has no `.agents/` or `.claude/` directory.** Earlier revisions of this file
listed `.agents/context/{system_architecture,product_requirements,design_system}.md` as
higher precedence than itself — those files were never carried over when this repo was
scaffolded from `uxiotopup-admin`. Do not go looking for them, and do not treat a
reference to them elsewhere as a pointer to something on disk here.

So, in order:

1. **The code** — it is live and integrated; when this file and the code disagree, the code wins and this file gets fixed.
2. **this `CLAUDE.md`** — the operating rules for this repo.
3. `uxiotopup-api`'s `CLAUDE.md` — the contract behind every `/v1/payment-admin/*` and `/v1/payment-internal/*` call, including the fee/tax and withdrawal rules this UI only renders.
4. The admin repo's `.agents/context/*` — useful for the **shared** conventions the two repos genuinely have in common (design tokens, feature isolation), but it describes the admin's scope, not this one.

## Project reality (important)

- **Backend is live.** Services call the real API through `@/lib/axios`; the response
  interceptor returns the full `{status,code,message,data}` envelope. Use `@/lib/list`'s
  `unwrapList` to normalise the two pagination shapes (Resource collection vs raw
  paginator).
- **Two roles, role-name based.** Permissions come from the role NAME, not `role_id`
  (`@/constants/roles`): `payment-internal` → `["payment-internal"]`, `payment-admin` →
  `["payment-admin"]`. Routes guard with `requirePaymentInternal` / `requirePaymentAdmin`
  (thin wrappers over `requirePermission`, in `@/middlewares/authMiddleware`) inside
  `beforeLoad`; the sidebar (`features/dashboard/components/DashboardSidebar.tsx`) switches
  nav on `user?.role === ROLES.INTERNAL`.
- **Feature slices**: `merchant` (client view) and `finance` (kita view); `dashboard`
  holds the shared shell (layout, sidebar, navbar); `auth` is login. Shared table/badge/
  pager primitives live in `components/common`.
- **Where an endpoint is genuinely missing**, keep the screen behind the same typed service
  interface and say so in the service — do not scatter placeholder data through components.
- **Transaksi punya dua status, bukan satu.** Feed membawa `payment_status`
  (gateway) dan `provider_status` (supplier); keduanya opsional dan diturunkan dari
  `status` oleh `src/lib/transactionStatus.ts` bila API belum mengirimnya. Semua
  kata yang dibaca orang ada di file itu — jangan pernah merender status mentah ke
  merchant. `provider_status` selalu null untuk baris tagihan layanan. Kosakatanya
  berbeda per audiens: merchant melihat lipatan 4 nilai, tampilan internal 8.
- **The payout bank/e-wallet catalogue is the API's**, fetched via `usePayoutBanks`
  (`GET /v1/payout-banks`, from the backend's `config/banks.php`). It used to live here as
  `src/constants/bankCodes.ts`; that copy is gone. Never re-bundle it — the same list also
  validates `bank_code` on submit and picks the Monetapay payout rail, so a local copy
  drifts silently into codes the API rejects. `isEwalletCode(banks, code)` decides
  account-number vs. phone; unknown codes count as bank transfers.
- **Style by token _name_** (monochrome; color only via `text-success`/`text-destructive`);
  numbers use `tabular-nums`; money via `@/utils/currency`.
- **Prefer TDD** for new features: test cases → failing tests → green. Vitest + React
  Testing Library; feature tests live in `features/<f>/tests/`.
- **Some wording here is inherited from the admin repo.** This file was copied along with
  the scaffold; anything that still reads as admin-only scope is drift, not instruction.
  The `README.md` is still the admin's verbatim — it has not been rewritten for this app.

## Workflow

**Plan -> Approve -> Build.** The `/plan-feature` and `/build-feature` slash commands this
section used to invoke live in the admin repo's `.claude/commands/` and **do not exist here**
— the workflow is the same, just run by hand:

1. **Plan the whole scope first.** Write the plan out, list the open decisions with a recommended default for each, and stop for approval before writing implementation code.
2. **Build one feature at a time, test-first:** test cases → failing tests → implement until green. Then stop for approval before starting the next one. Planning is whole-scope; execution is per-feature.
3. **Never invent business rules.** Fees, tax and settlement are decided by the API (`CheckoutAction`, `SettleMerchantTransactionAction`) and this UI only renders them — if a number here disagrees with the server's, the server is right. When unsure about design/architecture, present 2 options with a recommended default.

## Where things live

- `src/features/*` — the app, as isolated slices: `merchant` (client view), `finance` (kita view), `dashboard` (shared shell: layout, sidebar, navbar), `auth` (login).
- `src/components/{ui,common,layouts}` — `ui` is shadcn primitives; `common` holds the custom primitives (`Box`, `Container`, `Text`, `Heading`, `Image`, `Link`) plus the shared `DataTable`, `Can`, `ImageDropzone`, `ExportButton`, pager and badge pieces.
- `src/routes/` — registry-only; `routeTree.gen.ts` is generated, never hand-edit.
- `src/middlewares/authMiddleware.ts` — `requireAuth`, `requireGuest`, `requirePermission` and the two role wrappers.
- `src/lib/` — `axios.ts` (envelope + shared token refresh), `list.ts` (`unwrapList`), `utils.ts`; `src/utils/currency.ts` for money.
- `src/{store,types,config,constants}` — Zustand stores, `api.type`/`models`, `config/env.ts`, `constants/roles.ts`.
- `src/test/` — Vitest harness: `setup.ts` (global axios stub + jsdom gaps), `test-utils.tsx` (`renderRoute`, `makeUser`), `apiEnvelope.ts` (`envelope`/`paginated` builders), `payoutBanks.ts` (`mockPayoutBanks`). There is no `fakeApi.ts` here — that is the admin repo's.
- `logs/feature-changes/` — one entry per shipped feature; `TEMPLATE.md` is the shape.
- There is **no** `.agents/` or `.claude/` directory in this repo.

## Branding

This panel belongs to the CLIENT, not to kita. `src/hooks/useBranding.ts` reads
`site_name` from the public `/v1/storefront/settings` (unauthenticated, so the
login screen is branded too) and the sidebar wordmark and the login hero render it — never a hardcoded
"Uxiolabs". One deployment says "ISG Store", the next says whatever it is
called. The fallback is a real name rather than a blank, because a header that
flickers empty on every cold load looks broken.

## Commands

The slash commands and subagents this section used to list belong to the admin repo's
`.claude/` layer and **do not exist here**. The real commands are the npm scripts:

```bash
npm run dev        # Vite dev server
npm run build      # tsc -b && vite build  (typecheck is part of the build)
npm run lint       # ESLint
npm run test       # Vitest, single run — gates the production deploy
npm run test:watch # Vitest, watch mode
npm run preview    # Preview the production build
```

CI runs typecheck + lint + test on every PR (`.github/workflows/ci.yml`); the production
deploy re-runs the suite before it builds and rsyncs (`.github/workflows/deploy-prod.yml`),
then reports the outcome to Discord. A shipped feature still earns a
`logs/feature-changes/` entry — copy `TEMPLATE.md`.

## Conventions

These were mirrored from the admin repo's `.claude/rules/` (not present here) — they are
still how this repo is written:

- **Feature isolation** — no cross-feature imports; promote shared code up.
- **Custom primitives only** in feature TSX (`Box`/`Container`/`Text`/`Heading`/`Link`/`Image`); interactive controls -> shadcn/ui.
- **Tokens only** — no raw hex / palette classes; monochrome; color only via `text-success`/`text-destructive`/`chart-*`; numbers use `tabular-nums`.
- **Routing is registry-only**; guards (`requireAuth`/`requirePermission`) in `beforeLoad`, never in components.
- **Server data via TanStack Query only**; global client state via Zustand. The API is live, so a service wraps real HTTP — if an endpoint is genuinely missing, keep the typed service interface and say so there rather than scattering placeholder data through components.
- **TDD, always:** test cases → failing tests → implementation to green. Vitest + React Testing Library. Feature tests live in `features/<f>/tests/`; tests for shared code (`components/common`, `lib`, `utils`, `hooks`) sit next to the file. Never loosen/delete a test to pass it.
- TS strict, no `any`. Green (`tsc` + `lint` + `test`) before commit. Never `Read`/commit `.env*`.

## Service billing

A client pays a service bill through **Monetapay**, in the app — there is no
bukti-transfer upload any more.

- The checkout page picks a channel (`useServicePaymentChannels`) and posts
  `service_id` + `payment_channel_id`; the bill and its payment open together.
- `ServicePaymentCard` branches on which keys `payment.instructions` actually
  carries — `qr_string`, `virtual_account`, `redirect_url` — not on
  `payment.type`, so one card covers every method and an unfamiliar one degrades
  instead of blanking.
- `useMerchantServiceInvoice` polls every 5s while the invoice is `UNPAID` and
  stops on the **server's** status. Never re-derive "settled" here; the webhook
  decides it.
- An attempt that lapses is not a dead end: the card swaps to the picker and
  `usePayServiceInvoice` opens a fresh one. A VA expires in minutes, the bill in
  days.
- `adminFeeFor` (`features/merchant/lib/adminFee.ts`) mirrors the server's sum so
  the total moves as methods are compared. The server recomputes on submit and
  **its** figure is charged.
- `formatCurrency` renders a non-finite value as `-`. That is a guard, not a fix:
  a price showing `-` means the API stopped sending the field (a stale process
  after a column rename, say) — restart it.

`ImageDropzone` stays: the withdrawal flow still uploads proof.

## MCP (`.mcp.json`)

`context7` (live TanStack/Tailwind v4/shadcn/Zod docs), `shadcn` (browse/install primitives), `chrome-devtools` (QA screenshots/console/perf), `figma` (pull frames/tokens from file `l7izBcDr0PtS2FUdMdHFk3` — Dashboard node `22011-2008`, components `22078-1614`).

## Formatting

`.prettierrc` sets the house style (`singleAttributePerLine`, `tabWidth: 2`,
`printWidth: 120`), but **prettier is not a dependency here and no formatting hook runs** —
the admin repo's `PostToolUse` hook (`.claude/hooks/format.sh`) was not carried over. Match
the surrounding file by hand, or run prettier via `npx` with the config above.

## Definition of Done

(The `system_architecture.md §9` / `.agents/workflows/qa.md` this used to defer to are not in
this repo — the checklist itself is below.) A feature is done only when it is built
**test-first** with `npm run test` passing, feature-isolated, tokens-only, correct in both
themes, type/lint-clean, `<Can>`-gated where privileged, its tables have loading/empty/error
states, and it carries a `logs/feature-changes/` entry.
