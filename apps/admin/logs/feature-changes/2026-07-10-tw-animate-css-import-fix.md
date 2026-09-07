# 2026-07-10 — Fix missing `tw-animate-css` import (app-wide animation root cause)

**Scope:** app-wide (`src/index.css`) — surfaced while polishing the transactions Edit Transaction modal, but the fix is global
**Type:** fix
**Author/agent:** you (main thread)

## What changed

Added `@import "tw-animate-css";` to `src/index.css` (right after `@import "tailwindcss";`). Reverted the Edit Transaction modal's custom `zoom-in-90`/`zoom-out-90`/`duration-300` overrides back to the plain shadcn default (`rounded-2xl` only) now that the underlying animation actually works — a custom exaggerated transition is no longer needed to make the shadcn recipe "feel like something happens."

## Why

The user asked to "add fade in transition at edit transaction modal ... like on shadcn dialog documentation." Investigating: `tw-animate-css` was already an installed dependency and every shadcn primitive already used its utility classes (`animate-in`, `animate-out`, `fade-in-0`, `fade-out-0`, `zoom-in-95`, `zoom-out-95`, `slide-in-from-*`) — but the package was never `@import`ed into `src/index.css`. Tailwind v4 has no config file to register a plugin in some other way, so these classes compiled to nothing: every "transition" in every dialog/dropdown/tooltip/select in the app was a silently inert no-op the whole time, not a subtle one.

This explains why the previous polish pass's custom `zoom-in-90`/`duration-300` override on the Edit modal had no visible effect (verified visually as "still not animating") — the base recipe it was overriding never worked either, so tweaking its parameters changed nothing. Fixing the actual root cause (one missing `@import`) makes the *already-declared* classes across the whole codebase work as originally intended, which is a strictly better and simpler fix than adding more custom transition classes on top of a broken system.

## Files touched

- `src/index.css` — `@import "tw-animate-css";`
- `src/features/transactions/components/EditTransactionDialog.tsx` — reverted the custom zoom/duration override back to `rounded-2xl` only, now that the default shadcn fade+zoom transition (declared in `src/components/ui/dialog.tsx`) genuinely animates.

## Verification

- [x] `npm run test` passes (80/80, whole suite — no test asserts on animation classes, per the testing-strategy rule against className assertions)
- [x] `npx tsc --noEmit` clean
- [x] `npm run lint` clean (same pre-existing baseline)
- [x] Verified via chrome-devtools + `getComputedStyle`: on open, the dialog content's `animationName` is `"enter"` (`0.2s`) and the overlay's is `"enter"` (`0.15s`) with `background-color: oklab(0 0 0 / 0.7)` — previously these would have resolved to `animationName: "none"` since the classes were undefined. Confirmed the dialog also unmounts correctly after the close animation (Radix's `data-state=closed` + `animate-out` teardown).

## Notes / follow-ups

- **This fix is app-wide, not scoped to the transactions feature** — 13 shadcn primitives already reference `animate-in`/`animate-out` (`alert-dialog`, `combobox`, `context-menu`, `dialog`, `drawer`, `dropdown-menu`, `hover-card`, `menubar`, `navigation-menu`, `popover`, `select`, `sheet`, `tooltip`). All of them were silently missing their open/close transitions across every feature (dashboard, financial, auth, transactions) until this one-line import landed. Worth a quick pass over other screens to confirm nothing was relying on the previous "instant, no transition" behavior as if it were intentional — none currently is, based on this session's review, but flagging since it's a real behavior change surfacing everywhere at once.
