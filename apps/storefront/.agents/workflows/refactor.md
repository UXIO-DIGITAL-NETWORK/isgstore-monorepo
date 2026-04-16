---
description: Audit and refactor existing code to improve performance, readability, and adherence to the system architecture without altering the UI/UX.
---

# Workflow: Code Refactoring

**Trigger:** When the user asks to clean up code, improve performance, or migrate libraries without changing the UI/UX.
**Execution Order:** @pm -> @developer -> @qa

**Steps:**

1. **@pm** audits the current codebase, cross-references it with `context/SystemArchitecture.md` to find violations, and writes a refactoring strategy in `artifacts/technical_spec_review.md`.
2. **@pm** pauses for explicit user approval.
3. Upon approval, **@developer** meticulously executes the code cleanup (e.g., extracting components, applying `tailwind-merge`) ensuring the new structure perfectly adheres to the Feature-based architecture.
4. **@qa** aggressively audits the refactored code to ensure zero changes to functionality or UI/UX.
5. **@qa** writes the change log into the `artifacts/logs/` folder and notifies the user that the refactor is complete.
