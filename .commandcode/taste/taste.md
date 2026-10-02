# Taste

## Git & Workflow

- Follows a company SOP for git conventions, documented in `sop_it_department_v2.0.html` at the repo root — consults it (not personal convention) when naming branches or writing commit messages. Confidence: 0.8
- Branch names follow the SOP format `mtc-[role]-[nama-fitur]-[tanggal]` (e.g. `mtc-frontend-route-fixing-01102026`), with the date as DDMMYYYY; bug fixes use the `mtc-` maintenance prefix. Confidence: 0.85
- Writes commit messages in Indonesian using conventional-commit prefixes per the SOP (e.g. `fix(storefront): perbaiki …`). Confidence: 0.6
- Prefers working with local commits and only pushes when explicitly asked. Confidence: 0.5
- Typical feature-branch workflow: stash WIP, switch to the `staging` base branch, fast-forward pull, cut a new SOP-named branch off the updated `staging`, pop the stash, then commit. Confidence: 0.85
