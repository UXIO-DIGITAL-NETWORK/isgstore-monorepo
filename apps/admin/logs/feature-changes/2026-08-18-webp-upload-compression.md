# 2026-08-18 — Uploaded images are re-encoded to WebP in the browser

**Scope:** `ImageDropzone` + every form that uses it (category logo & OG image, sub-category logo, product logo, banner, testimonial avatar, announcement image)
**Type:** perf
**Author/agent:** you

## What changed
- New `src/lib/imageCompression.ts` — `compressImage(file)` re-encodes to WebP at quality 0.82 with the longest edge capped at 1920px, EXIF rotation baked into the pixels.
- `ImageDropzone.handleFiles` now runs it before calling `onChange`, with an "Optimising image…" state and the Browse button disabled while it runs.
- `DEFAULT_ACCEPT` gained `image/webp`; the formats label no longer promises "up to 10mb" it never enforced.
- `categoryForm.schema.ts` now accepts `image/webp` — without it the schema rejected the dropzone's own output.
- Payment proof (`EditTransactionForm`) is deliberately left alone.

## Why
- Uploads were going to the wire byte-for-byte: a 4000×3000 phone photo travelled as several MB and then sat on the storefront at that size. The API caps uploads at 2 MB, so large originals were rejected after a full upload.
- The API converts everything it receives anyway (`App\Services\ImageOptimizer`) — this is the shortcut, not the guarantee. Every skip rule here mirrors the server's, so the two never disagree about what an image should become.
- Proof of payment is evidence. Re-encoding it changes the artefact a dispute would be settled on, so both ends exclude it.
- Written with a canvas rather than a dependency: ~60 lines against a repo that carries no image library at all.

## Files touched
- `src/lib/imageCompression.ts`, `src/lib/imageCompression.test.ts`
- `src/components/common/ImageDropzone.tsx`
- `src/features/categories/schemas/categoryForm.schema.ts`
- `CLAUDE.md`

## Verification
- [x] `npm run test` passes (440 existing + 10 new)
- [x] `npx tsc -b --force` clean
- [x] `npm run lint` clean (0 errors; the 9 pre-existing React Compiler warnings are unchanged)
- [ ] `/qa-audit` — not run
- [ ] Both themes — the only visual change is a transient "Optimising image…" line inside the existing dropzone
- [ ] Figma — no visual spec change

## Notes / follow-ups
- `web-topup-fe` carries a byte-identical copy of `imageCompression.ts` for the member avatar. The unit tests live here (that repo's vitest runs on `node`, with no canvas). Change one, change both.
- Separate pre-existing bug, deliberately not fixed here: `EditTransactionForm.tsx:72` appends `"proofFile"` while `transactions.service.ts:224` reads `"proof"`, so an operator's uploaded proof is silently discarded and `/manual-review` is never called.
