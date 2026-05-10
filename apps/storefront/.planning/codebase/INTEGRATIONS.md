# INTEGRATIONS

This document outlines external services, APIs, and cross-system integrations within the application.

## API & Backend Integration
- **HTTP Client**: Uses `axios` for standardizing HTTP requests to the backend.
- **Server State Mapping**: `@tanstack/react-query` serves as the primary gateway for mediating between server data states and client caching.
- **Form Validation Bridge**: Data inputs destined for APIs are rigorously checked using `zod` paired with `react-hook-form`.

## Supported Backend Architectures
Since the frontend handles real-time validation (e.g., Live Nickname Validation) and invoice tracking:
- **Authentication**: JWT/Token-based via `js-cookie`.
- **Live Invoices**: Likely uses polling (via TanStack query interval) or WebSocket endpoints for real-time validation tracking (as per README criteria).

## Internal Integrations
- **Router to UI**: `@tanstack/react-router` interfaces heavily with `beforeLoad` functions mapping into standard `src/middlewares/` guards.
- **Theme/Local Storage**: `next-themes` integrates with `localStorage` (key: `vite-ui-theme`) for persisting the Dark Mode preferred by the Zelpoint design context.
