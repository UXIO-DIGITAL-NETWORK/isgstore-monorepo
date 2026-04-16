# System Architecture & Best Practices Brief: Multi-Game Top-Up Platform

**Target Audience:** Fullstack Developer, Frontend AI Agents
**Architecture Type:** Decoupled SPA (Single Page Application via API)
**Pattern:** Feature-Based Architecture (Bulletproof React inspired)

## 1. Communication Concept (The Bridge)

This project adopts an API-Driven architecture.

- **Backend (REST API):** Acts as the main engine handling core business logic, database interactions, and communication with Third-Party APIs (Game Servers & Payment Gateways).
- **Frontend (React 19 + TypeScript):** Pure presentation layer and interactive client that relies heavily on the TanStack ecosystem (Router & Query) and Zustand for maximum performance.

## 2. The Golden Rule of Frontend Architecture

This application strictly separates foundation/global code from specific business domain code.

> 🚨 **CRITICAL RULE:** A feature (inside the `src/features/` folder) **MUST NOT** import anything directly from another feature. Every feature domain must be completely standalone and decoupled.

## 3. Directory Structure

The directory structure is designed to prevent redundancy and confusion between _Global State/Types_ and _Local Feature Logic_.

```text
src/
├── components/               # 🧩 GLOBAL UI COMPONENTS
│   ├── common/               # Polymorphic custom components (Box, Heading, Text). Must use cva & cn().
│   ├── layouts/              # Global layout wrappers (RootLayout).
│   └── ui/                   # Third-party library components (Hero UI / Shadcn).
│
├── config/                   # ⚙️ GLOBAL SETTINGS: Env constants, axios instances.
├── lib/                      # 🛠️ PURE UTILITIES (e.g., `cn` function for tailwind-merge).
├── middlewares/              # 🛡️ ROUTE GUARDS: Route protection functions (e.g., requireAuth).
├── store/                    # 📦 GLOBAL CLIENT STATE: Zustand stores (e.g., useAuthStore.ts).
│
├── types/                    # 🌐 GLOBAL TYPES: Data types shared across multiple features.
│   ├── api.type.ts           # Common API response types (Pagination, Meta).
│   └── models/               # Database entity representations (User, Game, Transaction).
│
├── features/                 # 📦 BUSINESS DOMAIN: Strict isolation per feature.
│   ├── auth/                 # Login/register hooks, RHF forms, local Zod Schemas.
│   ├── checkout/             # Checkout Step 1-9 logic, local Game ID Validation.
│   └── home/                 # Homepage display & Promo Banners.
│
├── routes/                   # 📍 TANSTACK ROUTER ENTRY POINTS: File-based routing.
│   ├── __root.tsx
│   ├── index.tsx             # Homepage Route
│   └── _auth/                # Route group protected by AuthGuard
│
└── main.tsx                  # React 19 main initialization & Providers.
```

## 4. Frontend Best Practices (Strict Guidelines for AI & Developers)

### 4.1. Typing Strategy

- **Global Models:** Entities used in more than one feature (such as `User`, `Game`, `Transaction`) **MUST** be stored in `src/types/models/`. Never store global entities inside a specific feature folder.
- **Feature-Specific Types:** Data types used exclusively by a single feature (e.g., `LoginPayload`, `CheckoutFormSchema`) **MUST** be placed within their respective feature folders (e.g., `src/features/auth/types/`).

### 4.2. Routing & Route Protection (Auth Guards)

- **Type-Safe Routing:** ALWAYS use **TanStack Router**. Navigation must be strictly validated by TypeScript.
- **Middleware Pattern:** Do not place route protection logic (redirects) inside React UI components. Protection functions like `requireAuth()` and `requireGuest()` should read the token directly from Zustand (`useAuthStore.getState()`) and be injected exclusively into the `beforeLoad` property of the route definition files (e.g., `Route = createFileRoute('/_auth')({ beforeLoad: () => requireGuest() })`).

### 4.3. UI Components & Styling (Tailwind Collision Prevention)

- **Tailwind Usage:** Use Tailwind CSS v4 utility classes.
- **Polymorphic Components:** For custom abstract components (such as `<Box>`, `<Heading>`, `<Text>` acting as HTML tag replacements), developers **MUST** use class merging utility functions like `tailwind-merge` and `clsx` (usually combined into `cn()`) alongside `cva` (Class Variance Authority). This is critical to prevent CSS class collisions between default component classes and classes passed via the `className` prop.

### 4.4. State & Form Management (Separation of Concerns)

- **Server State:** Fetching and mutating data to the API is handled exclusively by **TanStack Query** (`useQuery`, `useMutation`).
- **Client State:** Use **Zustand** exclusively for UI states that are not derived from the database or global server state (such as temporarily storing form data or authentication status).
- **Form Handling:** All forms in the application **MUST** use **react-hook-form** integrated with `@hookform/resolvers/zod`. Zod schemas prevent the submission of dirty or invalid API payloads.
