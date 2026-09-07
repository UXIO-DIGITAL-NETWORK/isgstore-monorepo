# Feature-change logging (portable rule)

After any agent creates or changes a feature/screen/component, **before reporting done**: append a log entry to `logs/feature-changes/` (`YYYY-MM-DD-<slug>.md`, from `TEMPLATE.md`) describing what changed, why, files touched, and how it was verified. Logs are **history only** — not project knowledge. Commit the log with the change. (Claude Code: `/log-change`.)

**Why this matters here:** with a separate, not-yet-built backend, the log is the running record of which screens are real vs. mock-backed, which entity shapes are still provisional, and which design decisions (e.g. the neutral re-theme, the models → `types/models` move) were made and when. Skill mirror: `skills/log-change`.
