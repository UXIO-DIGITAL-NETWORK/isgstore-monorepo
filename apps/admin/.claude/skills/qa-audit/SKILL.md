---
name: qa-audit
description: Invokable — run the Definition of Done (types, isolation, design fidelity, authz, a11y); findings to .artifacts/qa-log.md. See .agents/skills/qa-audit.
user-invocable: true
---
# /qa-audit
Follow `.agents/workflows/qa.md`. Run `tsc`/`lint` + the grep gates (cross-feature imports, raw hex/off-token classes, bare HTML in features), verify `tabular-nums`, light+dark, Figma reconciliation, table loading/empty/error states, mocks behind the service boundary, `<Can>` + `beforeLoad` guards, and a11y (keyboard/focus/labels/overlay). Write severity + concrete fix per issue to `.artifacts/qa-log.md`. Read-only on source.
