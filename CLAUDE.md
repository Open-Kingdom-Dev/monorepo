<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors

<!-- nx configuration end-->

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project-specific guidance

The substantive AI context for this workspace lives in `.claude/`:

- [`.claude/CLAUDE.md`](.claude/CLAUDE.md) — stack, library map, package naming, standard module wiring patterns, Nx task commands
- [`.claude/rules/architecture.md`](.claude/rules/architecture.md) — library boundary rules, dependency graph, schema composition pattern
- [`.claude/rules/backend-patterns.md`](.claude/rules/backend-patterns.md) — NestJS module authoring, Drizzle, auth, DTOs
- [`.claude/rules/frontend-patterns.md`](.claude/rules/frontend-patterns.md) — Redux Toolkit, RTK Query, theming, DataGrid
- [`.claude/rules/nx-conventions.md`](.claude/rules/nx-conventions.md) — task running, project naming, library generation
- [`.claude/rules/code-generation.md`](.claude/rules/code-generation.md) — reuse-first checklist and anti-patterns

Claude Code auto-loads `.claude/CLAUDE.md`; read the rules files on demand when the task touches their domain.

## Task commands (quick reference)

Prefer the root `package.json` scripts over invoking Nx/tools directly:

- `npm run dev` / `npm run dev:backend` — dev servers
- `npm run check-all` — typecheck + lint + format + test + e2e
- `npm test` / `npm run test:affected` — run tests (use `nx test <project>` for a single project; `-t "<name>"` for a single test)
- `npm run swagger:generate-all` then `npm run client:generate-all` — regenerate RTK Query hooks after controller/DTO changes
- `npm run db:generate` / `db:migrate` / `db:push` / `db:studio` — Drizzle workflow
