---
description: Execute a complete development cycle to add a new feature, page, or component. Starts from technical specifications to coding and quality assurance.
---

# Workflow: Feature Development

**Trigger:** When the user asks to add a new feature, page, or component.
**Execution Order:** @pm -> @developer -> @qa

**Steps:**

1. **@pm** analyzes the new feature request, aligns it with `context/PRD.md` and `context/DesignSystem.md`, and creates a technical blueprint in `artifacts/technical_spec_review.md`.
2. **@pm** pauses for explicit user approval.
3. Upon approval, **@developer** implements the feature based on the spec, strictly adhering to `context/SystemArchitecture.md` (e.g., using `cn()`, avoiding cross-feature imports).
4. **@qa** audits the newly written code for TypeScript errors, missing imports, or architectural violations.
5. **@qa** writes the execution and change logs into the `artifacts/logs/` folder and notifies the user that the feature is ready for testing.
