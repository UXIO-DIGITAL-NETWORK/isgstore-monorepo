# CONVENTIONS

This document specifies the strict coding conventions, stylistic choices, and domain rules defined by the application standard.

## 1. Feature Isolation (The Golden Rule)
- Features in `src/features/` **MUST NOT** import code from other features.
- If features need shared types/entities, they must be drawn from `src/types/models`.

## 2. Authorization & Routing
- Route protections MUST be placed in `src/middlewares/`.
- Protections MUST be executed exclusively within the `beforeLoad` method on TanStack route definitions. Do not use React wrapper components to protect routes in the UI component tree.

## 3. UI Polymorphism
- Core components like `<Box>`, `<Heading>`, and `<Text>` must make use of the `cn()` helper string-merge combination (`tailwind-merge` + `clsx`) to avoid conflicting Tailwind CSS instructions.
- Follow the designated UI system inspired by Zelpoint:
  - **Background**: `#0a0a0a` (True Black)
  - **Primary Accent**: `#0ea5e9` (Sky Blue)
  - **Surface/Cards**: `#171717` (Dark Charcoal)
  - Gradient overlays (`from-black/80`) utilized to maintain contrast over images.

## 4. Query Over Effects
- `useQuery` MUST be used to retrieve live data.
- `useMutation` MUST be used for pushing logic to the backend.
- `useEffect` fetching is strongly prohibited to respect React 19 and TanStack standards.

## 5. Exports and Type Definitions
- Components should employ typed hooks via strict TypeScript checks (`tsconfig_rules`).
- Prefer relative path exclusions relying on the `@/` prefix aliases bound to the `src/` directory.
