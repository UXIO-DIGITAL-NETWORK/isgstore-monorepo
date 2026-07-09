---
name: log-change
description: Append a feature-change log entry (what/why/files/verification) before reporting done. Portable mirror of /log-change.
---
# Log a Change (portable)
Before reporting done, append `logs/feature-changes/YYYY-MM-DD-<slug>.md` from `TEMPLATE.md`: what changed, why, files touched, how verified (`tsc`/lint/QA/light+dark). Logs are **history only** — not project knowledge. Commit the log with the change (`rules/logging.md`). (Claude Code: `/log-change`.)
