---
name: plan-feature
description: Invokable Stage 1 planning — read context, write PLAN.md, surface open decisions, STOP for approval. See .agents/skills/plan-feature for the portable spec.
user-invocable: true
---
# /plan-feature
Follow `.agents/skills/plan-feature/SKILL.md` and `.agents/workflows/planning.md`. Read `.agents/context/{system_architecture,product_requirements,design_system}.md` + root `CLAUDE.md`, write `PLAN.md` (file tree, MVP order Dashboard->Financial->Transaction, shared primitives first, dependency+setup delta, PRD->mock-fixtures map), list open decisions with defaults (Finance scope TBD — do not invent). **STOP after PLAN.md; wait for approval; no implementation code.**
