---
description: Wire and verify interactions between frontend UI components and backend custom hooks/APIs to ensure type-safety and seamless error handling.
---

# Workflow: Integration & Wiring

**Objective:** Ensure a seamless and type-safe connection between frontend interfaces and data-fetching logic without data loss or routing errors.
**Trigger:** When both UI implementation (@frontend) and API Integration (@backend) for a specific feature are completed.
**Execution Order:** @qa -> (Wait for User)

**Steps:**

1. **@qa** verifies that the props and data payloads received from TanStack Query hooks perfectly match the TypeScript interfaces rendered by the React components.
2. **@qa** checks all navigation uses (`<Link to="...">` or `Maps()`) to ensure they connect to valid route trees in TanStack Router without TypeScript warnings.
3. **@qa** simulates form submissions to validate that Zod Schema errors and API error responses are successfully caught and accurately displayed in the UI.
4. **@qa** resolves any mismatches found, writes the integration log into `.artifacts/logs/`, and reports the final status back to the user.
