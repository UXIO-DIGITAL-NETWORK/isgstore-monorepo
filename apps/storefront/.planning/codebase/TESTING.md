# TESTING

This document describes the testing strategy, frameworks, and continuous validation patterns in the application.

## Current State
At this present commit, there is **no automated testing framework** configured directly inside the `package.json` environment (no Jest, Vitest, purely build checks).

The primary mechanism for preventing application faults falls back strictly on the compiler and linter rules:

## Type safety & Linting
- **Static Typing**: TypeScript (`typescript-eslint`) enforces rigorous type checks, specifically around application routes through `@tanstack/router-plugin` which pre-validates paths in `routeTree.gen.ts`.
- **Linting**: ESLint (`eslint.config.js`) enforces standard hooks guidelines (`eslint-plugin-react-hooks`) and React refreshing rules.
- **Form Integrity**: Client-side logic ensures input safety through `zod` schema restrictions directly inside hooks before any payloads cross network boundaries.

*Future developers should aim to install `vitest` and `@testing-library/react` for proper unit test isolation reflecting the defined `features/*` slices.*
