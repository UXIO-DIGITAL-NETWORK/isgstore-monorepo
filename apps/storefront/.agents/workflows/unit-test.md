---
description: Write and execute component and hook tests to guarantee application stability using Vitest and React Testing Library.
---

# Workflow: Unit & Feature Testing

**Objective:** Guarantee the stability of the Single Page Application (SPA), prevent regressions, and secure client-side logic before deployment.
**Trigger:** After a feature is fully integrated, or when the user explicitly requests test coverage.
**Execution Order:** @qa -> @backend / @frontend (if fixes needed) -> (Wait for User)

**Steps:**

1. **@qa** writes unit and integration tests for UI components and custom hooks using **Vitest** and **React Testing Library**.
2. **@qa** ensures test coverage for both Happy Paths (successful execution) and Sad Paths (Zod validation errors, loading/error states from TanStack Query).
3. **@qa** utilizes tools like **MSW (Mock Service Worker)** to mock external API responses to ensure well-isolated tests.
4. If any tests fail, **@qa** flags **@backend** (for data logic issues) or **@frontend** (for UI rendering issues) for fixes. If all pass, **@qa** writes the test report into `.artifacts/logs/` and notifies the user.
