---
description: Perform minor fixes, UI updates, or feature-based code refactoring without dismantling the core architecture.
---

# Workflow: Minor Update & Refactor

**Objective:** Perform minor bug fixes, dependency updates, visual tweaks, or code cleanup without breaking the existing Feature-Based architecture.
**Trigger:** When the user reports a bug, requests a minor visual tweak, or asks for code cleanup on an existing feature.
**Execution Order:** @frontend / @backend -> @qa -> (Wait for User)

**Steps:**

1. The assigned specialist (**@frontend** for UI/CSS, or **@backend** for Data/API integration) analyzes the existing code and identifies the bug or optimization opportunity.
2. The specialist applies the changes adhering strictly to Clean Code principles, modern React 19/TypeScript features, and avoiding the use of the `any` type.
3. The specialist ensures this refactoring does not violate domain boundaries between features (no illegal cross-imports) and that Tailwind classes are safely merged using the `cn()` utility.
4. Execution is handed over to **@qa** to run existing tests (Vitest) or verify UI integrity before finalizing the task with the user.
