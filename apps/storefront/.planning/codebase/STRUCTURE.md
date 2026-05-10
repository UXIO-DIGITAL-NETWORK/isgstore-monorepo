# STRUCTURE

This document details the folder structure and physical layout of the application.

## High-Level Directory Overview

```text
src/
├── assets/                   # Static resources like images, svgs, and fonts
├── components/               # Global / shared UI elements
│   ├── common/               # Polymorphic core components (Box, Heading, Text) via CVA
│   ├── layouts/              # Global layout wrappers (e.g. RootLayout)
│   └── ui/                   # Primitive base components (from Hero UI / Shadcn UI)
├── config/                   # Global application configurations and environment logic
├── constants/                # Global fixed constants, static enums
├── features/                 # Business domain isolated modules
│   ├── auth/                 # Local login/register components, hooks, logic
│   ├── home/                 # Landing page & banners
│   └── track/                # Invoice tracking / progress
├── hooks/                    # Global reusable custom React hooks
├── lib/                      # Base utilities and internal libraries (cn, axios config)
├── middlewares/              # Route protection functions (requireAuth, requireGuest)
├── models/                   # Frontend mapped abstractions (possibly redundant with types/models)
├── providers/                # React context providers (ThemeProvider, etc.)
├── routes/                   # TanStack Router File-system routes
├── store/                    # Global Zustand client state stores (e.g. useAuthStore)
└── types/                    # Global TypeScript typings
    └── models/               # Shared domain entities across features
```

## Key Files
- `src/main.tsx`: The root application bootstraper initializing React 19, TanStack Router tree, React Query Client, and Theme Providers.
- `src/index.css`: The main entrypoint for Tailwind CSS v4 styling rules.
- `src/routeTree.gen.ts`: Auto-generated map of routes created by `@tanstack/router-plugin`.
- `vite.config.ts`: Defines Vite ecosystem behavior including auto code-splitting with router plugin and Tailwind V4.
