# 2026-07-31 — Website Content feature (articles, news, categories, FAQ, pages, testimonials)

**Scope:** `src/features/content` (new), sidebar, fake API
**Type:** feat
**Author/agent:** @frontend + @api

## What changed

A new `content` feature module with six tabs at `/admin/content/*`, each a full CRUD slice against the API built in the same pass:

| Tab | Route | Endpoint |
|---|---|---|
| Articles | `/admin/content/articles` | `/v1/articles?type=article` |
| News | `/admin/content/news` | `/v1/articles?type=news` |
| Categories | `/admin/content/categories` | `/v1/article-categories` |
| FAQ | `/admin/content/faqs` | `/v1/faqs` |
| Pages | `/admin/content/pages` | `/v1/pages` |
| Testimonials | `/admin/content/testimonials` | `/v1/testimonials` |

Each has a list with search, server-side pagination, row selection and bulk delete, plus add and edit form pages. 20 registry-only route files, all under `requirePermission("content.view")`.

Sidebar: **Website Content** → `/admin/content` and **Pages** → `/admin/content/pages` are no longer `disabled`.

## Decisions worth recording

- **Articles and News are one table, not two features.** The API stores them in a single `articles` table discriminated by `type`, because they differ only in where the storefront surfaces them. The two tabs are thin wrappers passing `type` to one shared list and one shared form — splitting them would have duplicated the category relation, the SEO block and every query.
- **Body sections, not rich text.** The API stores a body as `[{heading?, paragraphs[]}]` — the exact shape the storefront's renderer already consumes — so live content drops in without rewriting a working component into `dangerouslySetInnerHTML`. `ContentSectionsBuilder` edits each section as one textarea and splits paragraphs on blank lines, which is the convention writers already use. `src/features/content/lib/sections.ts` owns both directions and is unit-tested, including that an empty heading is *omitted* rather than stored as `""` (the storefront renders a heading element whenever the key is present).
- **Badge label is separate from category.** A PUBG article files under the `lainnya` pill but badges as "PUBG Mobile". The form exposes an optional Badge Label that overrides the category name, matching the API's `category_label` column. Without it, either the pill set or the badge would have had to change on the storefront.
- **The category `key` is constrained to a slug and flagged as breaking to edit.** It is what the storefront's closed pill set and URLs match on.
- **Shared row-actions and toolbar components.** The six tables have identical actions, so `ContentRowActions` and `ContentToolbar` serve them all rather than six copies that would drift. Both derive their targets from the current pathname, so a preview base could never leak into a guarded route.
- **Route tests seed the auth store instead of using a preview twin.** The older features test through unguarded `-preview` routes; this one has none, so the tests authenticate and let `requireAuth`/`requirePermission` actually run.

## Files touched

- `src/features/content/**` (new — types, 4 services, 5 hook files, schemas, 5 components, layout, 10 pages, lib, tests)
- `src/routes/admin/_protected/content/**` (20 new route files)
- `src/features/dashboard/components/DashboardSidebar.tsx`
- `src/test/fakeApi.ts` (content collections + `type`/`article_category_id` filters)

## Verification

- [x] Built TDD-first for the parts that carry logic: `sections.ts` converters and the article service contract were written test-first
- [x] `npm run test` — 56 files, 351 tests
- [x] `npx tsc -b --force` clean
- [x] `npm run lint` — 0 errors (7 pre-existing warnings)
- [x] `npm run build` succeeds; route tree regenerated
- [x] Feature isolation: no new cross-feature imports (the one existing violation, `home` → `auth`, predates this)
- [ ] `/qa-audit` run
- [ ] Reconciled against Figma — **no frame exists for these screens**; layout follows the categories feature's established card/tab structure

## Notes / follow-ups

- Banners and announcements have API CRUD but no admin screen yet — they belong in this feature as two more tabs.
- Promos, flash sales, payment channels, users and settings all have endpoints now and still need their admin modules.
- The article form has no image upload control yet; the service and API both accept one (`image_path`), so it is a form-field addition only.
