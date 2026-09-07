---
description: Investigate, diagnose, and fix reported bugs or errors. Focuses on rapid resolution and regression testing.
---

# Workflow: Bug Fixing

**Trigger:** When the user reports an error, bug, or unexpected behavior.
**Execution Order:** @qa -> @developer -> @qa

**Steps:**

1. **@qa** analyzes the bug report, audits the relevant files to find the root cause, and writes a brief fix-plan in `.artifacts/technical_spec_review.md` (user approval is not required if it is a critical hotfix).
2. **@developer** reads the fix-plan and fixes the problematic code without altering or breaking other working features.
3. **@qa** verifies that the bug is completely resolved and no other code is broken (regression testing).
4. **@qa** audits any TypeScript or linting fixes.
5. **@qa** writes a summary of the fix into the `.artifacts/logs/` folder and notifies the user that the bug has been resolved.
