---
description: Run TypeScript + ESLint and report issues concisely.
---
Run and summarize results (file + line + fix), do not auto-fix feature logic:

!`npx tsc --noEmit`
!`npm run lint`

Context: TS `~5.9.3` strict + ESLint 9 flat config (`eslint.config.js`; `react-refresh/only-export-components` is intentionally off for `src/components/ui/**` — don't report that). `npm run build` runs `tsc -b` first, so anything reported here also breaks the build. Both must be clean before any commit (`.agents/rules/commit-rules.md`).
