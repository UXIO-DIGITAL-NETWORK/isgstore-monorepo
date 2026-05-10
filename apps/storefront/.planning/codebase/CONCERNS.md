# CONCERNS

This document outlines known tech debt, architecture risks, potential issues, and general concerns regarding the codebase's organic trajectory.

## Testing Debt
- **No Test Suite**: There is currently no `vitest` or `Playwright`/`Cypress` automated e2e testing configured. Business logic testing relies entirely on typescript transpilation boundaries and manual assessment.
  
## Hybrid UI Dependency Management
- The UI system combines both `@heroui/react` and raw Shadcn primitives (`radix-ui`), both using Tailwind v4. While powerful, utilizing multiple primary UI libraries may risk dependency clashing or styling overlap if the centralized `cn()` protocol is not rigorously followed. It is vital to ensure minimal overlap between Hero and Shadcn contexts to avoid application bloat.

## Scalability Risks
- Relying on polling loops in `TanStack Query` for "Live Invoice Tracking" can risk overwhelming the API during peak topup transactions if not carefully tuned (with proper stall times, and backoff). Switching to push models (WebSocket/Pusher) might be necessary later.
- While cross-domain imports logic is strictly barred conceptually, ESLint rules preventing the action physically are likely not configured in `eslint.config.js`, meaning isolation violations can currently occur silently by developer mistake.
