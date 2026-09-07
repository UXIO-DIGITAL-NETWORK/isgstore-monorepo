---
description: Analyze requirements, design state/API structures, and establish strict data contracts (Zod Schemas) before execution.
---

# Workflow: Planning

**Objective:** Define feature specifications, client/server state architecture, and establish API contracts between the UI and external services.
**Trigger:** When the user requests a new complex feature, a new API integration, or a major system change.
**Execution Order:** @pm -> (Wait for User) -> @backend

**Steps:**

1. **@pm** analyzes the user request and defines the detailed feature requirements.
2. **@pm** designs the API contract (JSON Request/Response structure) and defines the data schemas to be used as the basis for DTOs (Data Transfer Objects) on the client side.
3. **@pm** drafts the execution plan and divides the tasks into specific tickets for API/logic integration (`@backend`) and UI development (`@frontend`) inside `.artifacts/technical_spec_review.md`.
4. **@pm** explicitly pauses and asks for user approval on the spec.
5. Upon approval, **@pm** hands over the execution to **@backend** to begin building the data integration and routing foundation.
