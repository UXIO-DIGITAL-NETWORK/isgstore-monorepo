---
description: Build secure data foundations, API integrations, server state, and middleware logic using TypeScript and the TanStack ecosystem.
---

# Workflow: API Integration & Middleware Development

**Objective:** Build the API integration layer (Services), server state management (TanStack Query), data validation (Zod), and route protection (TanStack Router Middleware).
**Trigger:** After the technical spec is approved, or when the user requests a new endpoint/data fetching implementation.
**Execution Order:** @backend -> @frontend

**Steps:**

1. **@backend** creates or updates Service files (e.g., `src/features/[feature-name]/services/*.ts`) using Axios/Fetch to connect the application with external/internal APIs.
2. **@backend** defines strict validation rules using Zod Schemas in `src/features/[feature-name]/schemas/` and exports TypeScript data types (DTOs).
3. **@backend** wraps these Services into custom hooks using TanStack Query (`useQuery`, `useMutation`) inside the `hooks/` folder of each feature to handle caching and the asynchronous lifecycle.
4. **@backend** registers new routes using TanStack Router's file-based routing (in `src/routes/`), configures route loaders for data pre-fetching, and implements auth/middleware logic (e.g., redirects if unauthorized).
5. Once the API integration and server state are ready to use with a secure data structure adhering to the contract, **@backend** passes the execution to **@frontend**.
