# 2026-08-18 — Feedback moderation (delete a review)

**Scope:** feedback list (`/admin/feedback`)
**Type:** feat
**Author/agent:** @frontend

## What changed
- `feedbackService.remove(id)` → `DELETE /v1/ratings/{id}`, alongside the existing `list`.
- `useDeleteFeedback` mutation — invalidates the `feedback` key, `sonner` toast on success/failure.
- New `FeedbackRowActions` row menu (delete only), using the shared `DeleteConfirmDialog`. The whole menu sits behind `<Can permission="feedback.delete">`, so a view-only admin sees no trigger rather than an empty menu.
- `feedbackColumns` is now a factory taking `onDelete`, with an `actions` column appended.
- `FeedbackListPage` wires the mutation and memoizes the columns on the stable `mutate` reference.

## Why
- The page was read-only, so there was no way to remove spam or abusive reviews — the only moderation the feed actually needs.
- Deliberately **no** create/edit path. `ratings` rows are purchase-linked and render on the storefront as verified purchase reviews (`ListGameReviewsAction`); admin-authored text there would read as a real customer's words. The `testimonials` table exists for editorial content and is where admin-written copy belongs. Noted on `feedbackService` so the next person does not "complete the CRUD" by reflex.
- API side (separate repo, same branch): `UpdateRatingRequest` required `user_id` and had no `comment` field, so guest reviews were uneditable and no review's text could be corrected. Now `user_id` is nullable and `comment` is accepted (max 1000, matching the storefront submit paths).

## Files touched
- `src/features/feedback/services/feedback.service.ts`
- `src/features/feedback/hooks/useFeedback.ts`
- `src/features/feedback/components/FeedbackRowActions.tsx` (new)
- `src/features/feedback/components/feedbackColumns.tsx`
- `src/features/feedback/pages/FeedbackListPage.tsx`
- `src/features/feedback/tests/FeedbackDeleteFlow.test.tsx` (new)
- `src/features/feedback/tests/feedback.service.test.ts`

## Verification
- [x] Built TDD-first: tests written first, confirmed red (`remove` undefined), then implemented to green
- [x] `npm run test` passes — 440 tests / 78 files
- [x] `npx tsc -b --force` clean
- [x] `npm run lint` clean (9 pre-existing warnings in `transactions`, none in `feedback`)
- [ ] `/qa-audit` run
- [ ] Renders in **both** light and dark — needs a manual pass
- [ ] Reconciled against Figma frame — no frame for this row menu; follows the existing `ContentRowActions` pattern

## Notes / follow-ups
- `POST /v1/ratings` still lets an admin create a rating from nothing, which is the fabricated-review path this feature deliberately avoids. Flagged to the team; removing it is their call.
- No bulk delete — the row menu is enough until moderation volume says otherwise.
