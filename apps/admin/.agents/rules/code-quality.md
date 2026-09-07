# Code Quality

- TypeScript strict; **no `any`** (infer from Zod with `z.infer`, or declare explicit types).
- Functional components, React 19 idioms, named exports, path alias `@/`.
- Feature isolation: no cross-feature imports — promote shared code up (`components/common`, `lib`, `utils`, `hooks`, `types/models`).
- Design tokens only — no raw hex / magic px in components. `cn()` for conditional classes, `cva` for variants.
- Small, single-purpose components. No dead code, no commented-out blocks, no `console.log` in committed code.
- Server data lives in TanStack Query only; global client state in Zustand; local state in `useState` (see `system_architecture.md §4.3`).

**Why this matters here:** `npm run build` is `tsc -b && vite build` under TS `~5.9.3` strict — loose code fails the build, not just review. The repo is small (only `auth` is real; `dashboard` still holds demo widgets), so one `any`, one cross-feature import, or one off-token class stands out immediately in the QA greps.
