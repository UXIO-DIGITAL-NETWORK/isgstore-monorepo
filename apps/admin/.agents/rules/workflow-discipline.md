# Workflow Discipline

- **Plan → Approve → Build.** @pm produces `PLAN.md` and **PAUSES**; no implementation code before the user approves (`workflows/planning.md`).
- Planning is **whole-scope** (all MVP screens); execution is **one feature/screen at a time**, each ending at its own **stop-for-approval gate** before the next starts (`workflows/feature.md`).
- **Every feature is built TDD-first** (`rules/testing-strategy.md`, `system_architecture.md §4.11`): test cases defined → failing tests written → implementation to green. This is standing policy for all features, not a per-feature decision.
- Run `/qa-audit` per feature (includes `npm run test`), fix findings, then commit — before moving on.
- Use subagents (`@frontend`, `@api`, `@qa`) to keep the main context clean.
- When uncertain about a design/architecture/business choice, **present 2 concise options with a recommended default — never assume.** Business rules that are TBD in `product_requirements.md` (e.g. Finance settlement/fees) must be surfaced as open decisions, not invented.

**Why this matters here:** the backend does not exist yet (UI-first) and Finance business logic is deliberately unspecified — guessing there creates rework when the API contract lands. MVP order is **Dashboard → Financial → Transaction**; each ships as one approved, QA'd commit with its log entry.
