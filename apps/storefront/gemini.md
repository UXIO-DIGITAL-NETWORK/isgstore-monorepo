# AI Agent Instruction Context

## Project Overview

- **Name:** React Enterprise Boilerplate
- **Architecture:** Feature-Based Architecture
- **Language:** TypeScript (Strict Mode)
- **Build Tool:** Vite

## Tech Stack

- **Framework:** React 18 (Functional Components only)
- **Routing:** TanStack Router (File-based, 100% type-safe)
- **Server State:** TanStack Query v5 (React Query)
- **Client State:** Zustand
- **Styling:** Tailwind CSS + Shadcn UI
- **Forms:** React Hook Form + Zod + @hookform/resolvers
- **HTTP Client:** Axios

## Strict Architecture Rules & Best Practices

### 1. Feature-Based Isolation

- NEVER place domain-specific logic, pages, or complex UI in `src/components` or `src/routes`.
- `src/components/ui/` is strictly reserved for "dumb" Shadcn UI generated components.
- Group everything by business domain inside `src/features/[feature-name]/` (e.g., `auth`, `dashboard`). A feature folder should contain its own `api`, `layouts`, `pages`, `types`, and `components`.

### 2. STRICT Routing & Middleware Enforcement (The Registry Pattern)

- **ZERO UI IN ROUTES:** Files inside `src/routes/` MUST NOT contain any component definitions (JSX/TSX blocks). They are strictly "Registry Files". They must only import and assign a `component` from `src/features/...`.
- **ZERO MIDDLEWARE IN ROUTES:** Do not write inline authentication or validation logic inside the `beforeLoad` function in route files. All middleware logic must be extracted to standalone functions inside `src/middlewares/` and imported into the route files.
- **Example of CORRECT route file (`src/routes/auth/login.tsx`):**

  ```tsx
  import { createFileRoute } from "@tanstack/react-router";
  import { LoginPage } from "@/features/auth/pages/LoginPage";

  // Middleware should be imported, not written inline
  import { requireGuest } from "@/middlewares/authMiddleware";

  export const Route = createFileRoute("/auth/login")({
    beforeLoad: () => requireGuest(),
    component: LoginPage,
  });
  ```

### 3. STRICT State Management Rules

- **Server State (API Data):** MUST use TanStack Query. NEVER use Zustand or React's `useState` to permanently store API fetch results. Let TanStack Query exclusively handle caching, data synchronization, and loading/error states.
- **Client State (UI State):** MUST use Zustand. Use it exclusively for global UI state that needs to persist across renders (e.g., theme toggle, sidebar open/closed, multi-step form drafts). Store Zustand files inside `src/store/`. Do NOT put API fetching logic or server data here.
- **Local State:** Use React's built-in `useState` ONLY for state that is strictly isolated and relevant to a single component.

### 4. STRICT API Layer (TanStack Query)

- **Location:** `src/features/[feature-name]/api/`.
- **Pattern:** Use standard TanStack Query hooks (like `useQuery`, `useMutation`) to define data fetching and mutations.
- **Type Safety:** Ensure all API functions and fetchers return strictly typed data interfaces.

### 5. STRICT Form Handling & Typing

- **Separation of Types and Schemas:** - Put runtime validation schemas (Zod) inside `src/features/[feature-name]/schemas/`.
  - Put compile-time static types and API response interfaces inside `src/features/[feature-name]/types/`.
- **Resolver Usage:** All forms MUST use `react-hook-form` connected with `@hookform/resolvers/zod`.
- **No Inline Validation:** Do not write manual validation logic inside the component JSX.

### 6. STRICT Component Hierarchy

- **`src/components/ui/`**: Only Shadcn generated components. No business logic, no state, no API calls.
- **`src/components/common/`**: Common components used across the app. MUST replace standard HTML elements:
  - `Box` -> `div`, `section`, `article`, `span`, etc
  - `Text` -> `p` and `span`
  - `Heading` -> `h1` - `h6`
  - `Container` -> `div` but centered with max width
  - `Image` -> `img`
  - `Link` -> `a`
- **`src/components/layouts/`**: Global layout wrappers (e.g., `RootLayout`, `AuthLayout`).
- **`src/features/.../components/`**: Feature-specific presentational ("dumb") components.
- **`src/features/.../pages/`**: "Smart" components that assemble feature pieces and connect directly to hooks/APIs.

### 7. STRICT Middleware Pattern

- **Location:** `src/middlewares/`.
- **Purpose:** Handle cross-cutting concerns like authentication, authorization, and route guards (e.g., `requireAuth`, `requireGuest`).
- **Usage:** Must be imported and executed inside the `beforeLoad` function of TanStack Router route files.

### 8. TypeScript & React Best Practices

- NO `any` types allowed. Use explicit types or infer them from Zod schemas (`z.infer<typeof schema>`).
- Use custom hooks (`use...`) to abstract complex logic out of components. Components should ideally handle only JSX and simple wiring.
- Use `cn()` from `src/lib/utils.ts` for conditional Tailwind class merging (Shadcn standard).

### 9. STRICT Constants & Configuration

- **Assets (`src/assets/`):** For static physical files (images, icons, fonts).
- **Config (`src/config/`):** For dynamic, environment-driven configurations (e.g., API URLs from `.env`).
- **Constants (`constants/`):** For hardcoded, immutable values (regex, pagination limits, enum arrays).
  - Place feature-specific constants inside `src/features/[feature]/constants/`.
  - Place app-wide constants inside `src/constants/`.

## Base Features Included

- **Authentication Module:** Login, Register, Forgot Password flows.
- **Routing Middleware:** Protected & Guest route guards.
- **Home Module:** Landing Page.

## Directory Structure

**Note:** The directory structure is subject to change based on the project requirements.

```text
react-enterprise-boilerplate/
├── public/
│   └── vite.svg
├── src/
│   ├── assets/                 # Static assets (images, fonts, icons)
│   ├── components/             # Global UI components
│   │   ├── layouts/            # Global layouts (e.g., RootLayout)
│   │   └── ui/                 # 👈 Shadcn generated components (button, input, etc.)
│   ├── common/                 # Common components used across the app
│   ├── config/                 # App configuration (env variables, constants)
│   │   └── env.ts
│   ├── features/               # 📦 MAIN FEATURE MODULES (Feature-Based)
│   │   ├── auth/               # Authentication Module
│   │   │   ├── api/            # Login, register fetchers (TanStack Query)
│   │   │   ├── layouts/        # AuthLayout.tsx
│   │   │   ├── pages/          # LoginPage.tsx, RegisterPage.tsx, etc.
│   │   │   └── types/          # auth.schema.ts (Zod schemas)
│   │   ├── home/               # Home/Landing Page Module
│   │   │   └── pages/          # HomePage.tsx
│   │   └── dashboard/          # (Draft for future feature)
│   │       ├── layouts/        # DashboardLayout.tsx (Sidebar, Navbar)
│   │       └── pages/          # DashboardPage.tsx
│   ├── hooks/                  # Global custom hooks (useDebounce, useMediaQuery)
│   ├── lib/                    # Third-party setups
│   │   ├── axios.ts            # Axios config & interceptors
│   │   ├── react-query.ts      # QueryClient config
│   │   └── utils.ts            # Shadcn helper (cn function)
│   ├── middlewares/            # 🛡️ ROUTE PROTECTION LOGIC
│   │   └── authMiddleware.ts   # requireAuth(), requireGuest()
│   ├── providers/              # 📦 PROVIDERS
│   │   └── theme-provider.tsx  # ThemeProvider
│   ├── routes/                 # 📍 ROUTING REGISTRY (Extremely Clean)
│   │   ├── __root.tsx          # Root layout provider
│   │   ├── index.tsx           # '/' -> Renders HomePage
│   │   ├── _protected.tsx      # Dashboard area layout -> requireAuth
│   │   └── auth/               # '/auth' group
│   │       ├── route.tsx       # '/auth' layout -> requireGuest
│   │       ├── login.tsx       # '/auth/login' -> Renders LoginPage
│   │       ├── register.tsx    # '/auth/register' -> Renders RegisterPage
│   │       └── forgot-password.tsx # '/auth/forgot-password'
│   ├── store/                  # 🧠 GLOBAL CLIENT STATE (Zustand)
│   │   ├── useAuthStore.ts     # User session data (optional)
│   │   └── useThemeStore.ts    # Theme state (dark/light)
│   ├── types/                  # Global TypeScript types (e.g., ApiResponse<T>)
│   ├── utils/                  # Pure helper functions (formatDate, formatCurrency)
│   ├── App.css                 # Global CSS & Tailwind layers
│   ├── main.tsx                # React Entry Point (Providers)
│   ├── routeTree.gen.ts        # 🤖 TanStack auto-generated file (DO NOT EDIT)
│   └── vite-env.d.ts
├── .eslintrc.cjs
├── .gitignore
├── AGENT.md                    # 🤖 AI Agent Instructions
├── components.json             # Shadcn UI Config
├── package.json
├── postcss.config.js
├── README.md                   # Project Documentation
├── tailwind.config.js
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts              # Vite + TanStack Router Plugin Config
```
