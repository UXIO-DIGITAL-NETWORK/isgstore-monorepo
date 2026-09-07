---
name: impeccable
description: Pointer stub — the full impeccable design skill (v3.9.1) is vendored at .claude/skills/impeccable/ for Claude Code. Portable note only.
---
# impeccable (vendored — pointer)
The full **impeccable** skill (production-grade frontend design/redesign/critique/polish/audit, incl. dashboards, app-shells, forms, empty states, tokens, a11y, motion) lives at `.claude/skills/impeccable/` with its `reference/` playbooks and `scripts/` engine. It is project-agnostic and kept verbatim (Apache-2.0, v3.9.1).
- Invoke in Claude Code: `/impeccable <craft|shape|audit|critique|polish|clarify|distill|harden|optimize|layout|typeset|colorize|delight|...> [target]`. Run `/impeccable init` on first use.
- It reads `PRODUCT.md`/`DESIGN.md` if present; for this repo, treat `context/product_requirements.md` + `context/design_system.md` as the equivalents (or let `init` scaffold). For a brand-new palette it may seed one — **override in favor of our committed neutral tokens** (`design_system.md §3.1`); identity-preservation wins.
Use during feature builds for craft, not only review.
