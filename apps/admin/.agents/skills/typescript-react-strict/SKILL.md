---
name: typescript-react-strict
description: TypeScript strict + React 19 idioms for this project. Activate for any component/hook/type work.
---
# TypeScript + React (strict)
Authoritative: `context/system_architecture.md §4`.
- TS `~5.9.3` strict, **no `any`** — infer from Zod (`z.infer<typeof schema>`) or declare explicit types. `npm run build` runs `tsc -b` first, so type errors break the build.
- Functional components, React 19 idioms, **named exports**, path alias `@/`.
- Feature isolation: no cross-feature imports; promote shared code up. Global entities -> `src/types/models/`; feature types -> `features/<f>/types/`.
- Custom hooks (`use...`) abstract logic out of components. `cn()` for classes, `cva` for variants.
- No dead code / commented blocks / `console.log` in committed code.
Enforcement mirror: `.claude/rules/react-typescript.md`.
