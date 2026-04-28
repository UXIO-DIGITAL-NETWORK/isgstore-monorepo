---
description: Audit and refactor existing code to improve performance and adhere to Action/Feature-Based architecture without altering UI/UX.
---

# Workflow: Code Refactoring (`/refactor`)

**Trigger:** The user inputs `/refactor [file or component name]`.

## Execution Steps:

1. **Analysis (@developer):**
   - `@developer` scans the target file/module to identify technical debt (e.g., Fat Controllers, logic in Models, monolithic React components, improper Axios token interceptors).

2. **Execution (@developer):**
   - `@developer` rewrites the code strictly adhering to `.agents/app/system_architecture.md`.
   - **Rule:** Refactoring MUST NOT change the existing business logic or the API contract payload (unless explicitly requested).

3. **Audit (@qa):**
   - `@qa` performs a strict review to ensure the refactored code maintains 100% functional parity with the original code.
   - `@qa` generates `.artifacts/logs/refactor_log_[timestamp].md` listing the improvements made and notifies the user.
