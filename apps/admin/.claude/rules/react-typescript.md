# React + TypeScript (always on) — mirrors `.agents/skills/typescript-react-strict`

- TS `~5.9.3` strict; **no `any`** — infer from Zod (`z.infer`) or declare explicit types. `npm run build` runs `tsc -b` first, so type errors break the build (not just review).
- Functional components, React 19 idioms, named exports, path alias `@/`.
- Custom hooks (`use…`) pull logic out of components. `cn()` (`src/lib/utils.ts`) for conditional classes; `cva` for variants.
- No dead code, no commented-out blocks, no `console.log` in committed code.
- ESLint 9 flat config (`eslint.config.js`); `react-refresh/only-export-components` is intentionally off for `src/components/ui/**` (shadcn exports variants alongside components) — don't flag that.

**Why this matters here:** with strict `noUnusedLocals`/`noUnusedParameters` and a small codebase, one `any` or unused import is immediately visible and fails the build the QA gate runs.
