---
description: Run TypeScript + ESLint and report issues concisely.
---
Run and summarize results (file + line + fix), do not auto-fix feature logic:

!`npx tsc -b --force`
!`npm run lint`

Context: TS `~5.9.3` strict + ESLint 9 flat config (`eslint.config.js`; `react-refresh/only-export-components` is intentionally off for `src/components/ui/**` — don't report that). It must be `tsc -b` (build mode): the root `tsconfig.json` is solution-style (`"files": []` + project references), so a plain `npx tsc --noEmit` type-checks **zero** files and always exits 0 — a vacuous pass (caught 2026-07-13). `--force` defeats the incremental cache so the check is always full. `npm run build` runs `tsc -b` first, so anything reported here also breaks the build. This command is type/lint only — the test suite is run by `/qa-audit` and `/commit`, not here. All three (`tsc`, `lint`, `test`) must be clean before any commit (`.agents/rules/commit-rules.md`).
