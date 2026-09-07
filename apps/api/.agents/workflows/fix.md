---
description: Investigate, diagnose, and fix reported bugs, errors, or visual glitches.
---

# Workflow: Bug Fix (`/fix`)

**Trigger:** The user inputs `/fix [description of the bug or error log]`.

## Execution Steps:

1. **Diagnosis (@developer):**
   - `@developer` analyzes the provided error log or bug description.
   - Isolates the issue: Is it a backend API issue (e.g., 500 Server Error, DB Constraint) or a frontend issue (e.g., React state unhandled, CORS, 401 Token Expiry)?

2. **Execution (@developer):**
   - `@developer` implements the fix securely.
   - If the fix requires architectural changes, `@developer` MUST consult `.agents/app/system_architecture.md`.

3. **Verification & Logging (@qa):**
   - `@qa` reviews the fix to ensure it doesn't violate the Action-Oriented architecture or Stateless flow.
   - `@qa` writes an incident resolution log to `.artifacts/logs/fix_log_[timestamp].md` and notifies the user.
