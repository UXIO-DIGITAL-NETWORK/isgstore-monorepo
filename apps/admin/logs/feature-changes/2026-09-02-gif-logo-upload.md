# 2026-09-02 — Animated GIF logo uploads

**Scope:** `administration` (Settings)
**Type:** feat
**Author/agent:** you

## What changed

- `SettingsPage` accepts `image/gif` for the client logo and says so in its formats label.

## Why

- `imageCompression.ts` already returns animated GIFs untouched, and the API's `ImageOptimizer` uses the same heuristic — so client and server could never disagree about a given file. Only the `accept` list and the server's mimes rule stood in the way.
- `accept` filters the file picker only: `ImageDropzone` forwards a *dropped* file without checking it, so the server rule is what actually guards. Both were changed together.

## Files touched

- `src/features/administration/pages/SettingsPage.tsx`

## Verification

- [x] `npm run test` passes
- [x] `tsc --noEmit` clean
- [x] `npm run lint` clean
- [ ] Manual: upload a 3 MB animated GIF and confirm it still animates after saving

## Notes / follow-ups

- The API narrows the accepted formats by setting key — an animated favicon or OG image is deliberately not supported.
