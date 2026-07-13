---
name: qa-audit
description: Run the Definition of Done per feature and globally — type-safety, feature isolation, design fidelity, authz, a11y — findings to .artifacts/qa-log.md. Portable mirror of /qa-audit.
---
# QA Audit (portable)
Run the checklist in `workflows/qa.md` against the audited feature (and once globally): `tsc -b --force` + `lint` clean, no `any`, no cross-feature imports, no raw hex / off-token palette classes, no bare HTML tags in feature TSX, `tabular-nums` on numbers, both light+dark render, Figma reconciled, server-side tables have loading/empty/error states, mocks behind the service boundary, `<Can>` on privileged actions + guards in `beforeLoad`, keyboard/focus/labels/overlay containment, and a `logs/feature-changes/` entry present. Write severity + concrete fix per issue to `.artifacts/qa-log.md`. Read-only on source — report, don't rewrite. (Claude Code: `/qa-audit`.)
