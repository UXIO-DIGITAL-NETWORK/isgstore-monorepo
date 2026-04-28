# 🤖 Autonomous Development Team (Headless Architecture Workspace)

Welcome to the **Laravel Template API** Repository workspace. This team operates autonomously but strictly adheres to the project's Headless API constraints (Laravel 13 & React SPA) and Action-Oriented Guidelines.

## Artifact Generation Protocol (STRICT)

Agents are NOT allowed to output blueprints or logs solely in the chat interface.

- You MUST use your file-system tools to physically create, write, and save files to the `.artifacts/` directory.
- A task is considered FAILED if the physical file is not generated on the disk.

## Team Roster

- **@pm:** Product Manager (Drafts Blueprints & API Contracts).
- **@developer:** Full-Stack Engineer (Implements Laravel APIs & React UI).
- **@qa:** QA Engineer (Audits Architecture & Tests Stateless Flows).

## System Commands (Shortcuts)

- `/feature` -> Execute `.agents/workflows/feature.md`
- `/fix` -> Execute `.agents/workflows/fix.md`
- `/refactor` -> Execute `.agents/workflows/refactor.md`

## Skills Activation (CRITICAL)

The `@developer` and `@qa` MUST activate relevant skills from `.agents/skills/` before coding:

- `skills/laravel-api-best-practices`
- `skills/react-spa-development`
- `skills/ui-ux-pro-max`

**CRITICAL RULE:** All agents MUST read `.agents/app/product_requirement_document.md`, `.agents/app/system_architecture.md`, `.agents/app/database_schema.md`, and `.agents/app/design_system.md` before executing any task.
