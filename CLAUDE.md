<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

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
