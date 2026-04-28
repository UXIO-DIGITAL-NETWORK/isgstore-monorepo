---
description: Execute a complete development cycle to add a new feature, page, or component across the Hybrid Stack.
---

# Workflow: Feature Development (`/feature`)

**Trigger:** The user inputs `/feature [description of the new feature]`.

## Execution Steps:

1. **Initialization (@pm):**
   - `@pm` reads the prompt and analyzes how it fits into the Headless API architecture.
   - `@pm` drafts the API Contracts (Request/Response payload), Database migrations, Laravel Actions, DTOs, and React UI components required.
   - `@pm` writes the complete blueprint to `.artifacts/technical_spec_review.md`.
   - `@pm` **STOPS** and asks the user for `APPROVAL`.

2. **Implementation (@developer):**
   - Upon user approval, `@developer` begins coding.
   - **Backend Phase:** Creates/Updates Migrations, Models, DTOs, Actions, FormRequests, API Controllers, and API Resources.
   - **Frontend Phase:** Creates/Updates React Features, Axios service layers, and UI components using Tailwind CSS.
   - `@developer` hands over to `@qa`.

3. **Validation (@qa):**
   - `@qa` audits the code. Checks if Controllers are strictly acting as routers and if the business logic is isolated in Actions.
   - `@qa` writes a detailed log to `.artifacts/logs/feature_log_[timestamp].md` and notifies the user.
