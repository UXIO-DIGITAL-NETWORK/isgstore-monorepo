# Feature-change logging (always on) — mirrors `.agents/rules/logging`

After creating/changing a feature/screen/component, **before reporting done**: append `logs/feature-changes/YYYY-MM-DD-<slug>.md` (from `TEMPLATE.md`) — what changed, why, files touched, how verified. Logs are **history only** (project knowledge lives in agent memory). Commit the log with the change. Command: `/log-change`.

**Why this matters here:** with a not-yet-built backend, the log is the running record of which screens are real vs. mock-backed, which entity shapes are still provisional, and when decisions (neutral retune, `models` -> `types/models`) landed.
