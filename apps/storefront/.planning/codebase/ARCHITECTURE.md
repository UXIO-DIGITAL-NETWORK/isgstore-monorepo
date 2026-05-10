# ARCHITECTURE

This document describes the high-level architecture patterns, system design, and overarching logic paths of the application.

## Feature-Based Architecture
The project strictly implements a **Feature-Based Architecture**. Code is structured around business domains rather than purely by technical function (like controllers, views).
- Business logic is completely encapsulated within `src/features/[feature_name]`.
- Cross-domain imports (feature A importing from feature B) are **strictly forbidden**. Any shared context must rely on `src/types/models` or global context.

## Route Handling & Protection
- Uses File-based routing via `TanStack Router`.
- Route guards (Authentication/Guest blocks) operate exclusively at the routing layer (`beforeLoad`) instead of using component-level React wrapper guards. These guard functions reside in `src/middlewares/`.

## State Management Architecture
Separation of concerns is maintained between UI states and database mapped states:
1. **Server State**: Managed tightly by `TanStack Query`. Used for all data fetching (fetching user profiles, retrieving topup items) and data mutations. Direct mapping of backend to memory cache.
2. **Client State**: Handled globally via `Zustand`. Used for temporary client states (UI toggles, transient guest shopping session state, multi-step checkout state).

## Theming & UI Architecture
- Polymorphic Component pattern used for primitive UI elements like `Box`, `Text`, `Heading`.
- Centralized `cn()` utility (`clsx` + `tailwind-merge`) guarantees deterministic CSS outcomes, heavily used with `class-variance-authority` (CVA).
