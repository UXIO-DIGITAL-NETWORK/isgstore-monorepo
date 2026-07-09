---
description: Append a feature-change log entry (what/why/files/verification) before reporting done.
argument-hint: <short-slug>
---
Create `logs/feature-changes/$(date +%Y-%m-%d)-"$ARGUMENTS".md` from `logs/feature-changes/TEMPLATE.md`:
- **What changed** and **why**; **files touched**; **how verified** (`tsc`/lint/`/qa-audit`/light+dark).
Logs are **history only** — not project knowledge (that lives in agent memory). Commit the log with the change it documents (`.claude/rules/logging.md`).
