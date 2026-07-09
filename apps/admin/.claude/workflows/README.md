# Claude Code workflows

The authoritative, portable workflow definitions live in `.agents/workflows/` — this folder is a pointer for Claude Code users.

| Stage | Portable spec | Invoke |
| --- | --- | --- |
| Whole-scope planning (STOP for approval) | `.agents/workflows/planning.md` | `/plan-feature` |
| Build one feature/screen (STOP after each) | `.agents/workflows/feature.md` | `/build-feature <feature>` |
| Definition-of-Done audit | `.agents/workflows/qa.md` | `/qa-audit` |
| Token/primitive maintenance | `.agents/workflows/design-system.md` | (manual + `/add-shadcn`) |

Rhythm: **planning is whole-scope; execution is one feature per approval gate.** MVP order: Dashboard -> Financial -> Transaction.
