# <YYYY-MM-DD> — <short title>

> Copy this file to `logs/feature-changes/YYYY-MM-DD-<slug>.md`. History only — durable knowledge goes in agent memory, not here.

**Scope:** <feature/screen/component, e.g. transactions list>
**Type:** feat | fix | refactor | style | chore | docs | perf | a11y
**Author/agent:** <@frontend | @api | @qa | you>

## What changed
- <bullet: the concrete change>

## Why
- <bullet: reason / decision. If a provisional call was made (e.g. Finance field shape), note it as provisional pending the API contract.>

## Files touched
- `src/...`

## Verification
- [ ] Built TDD-first: test cases defined, failing tests written, then implemented to green
- [ ] `npm run test` passes
- [ ] `npx tsc --noEmit` clean
- [ ] `npm run lint` clean
- [ ] `/qa-audit` run (findings in `.artifacts/qa-log.md`)
- [ ] Renders in **both** light and dark
- [ ] Reconciled against Figma frame (node id: <...>)

## Notes / follow-ups
- <anything deferred, e.g. swap mock service -> real API when backend lands>
