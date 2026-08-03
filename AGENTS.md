# Vera Sesiom — Agent Skills Registry

This file registers all available skills for AI agents working on Vera Sesiom projects.

## Project Skills

This repository currently has **no project-level skills registered**.

Only the shared global conventions remain under `.agents/skills/`:

- [`.agents/skills/_shared/conventions.md`](.agents/skills/_shared/conventions.md) — Naming, idioma, principios fundamentales

## Canonical skills location

`.agents/skills/` is the **single source of truth** for project-level skills in this repository.

For tooling that historically scanned legacy locations (`.claude/skills/`, `.windsurf/skills/`), both directories are kept as relative symlinks:

- `.claude/skills -> ../.agents/skills`
- `.windsurf/skills -> ../.agents/skills`

When new project-level skills are introduced, they MUST be added under `.agents/skills/` only. Edits to legacy symlink targets resolve to `.agents/skills/` automatically. The current contents of `.agents/skills/` are limited to `_shared/conventions.md`.

## How to Use

Use the project skills directly from `.agents/skills/` (when present) and reference this file from your agent configuration. Skills are loaded automatically based on context triggers.

Until project-level skills are added, follow the technical rules in the next section and consult the global conventions in `_shared/conventions.md`. Skills available at user or global scope are not registered here; consult the runtime registry at `.atl/skill-registry.md` for the global scope.

## Rules for Agents

1. **ALWAYS read `_shared/conventions.md` first** — global naming and coding conventions
2. **Follow hexagonal architecture** — this is non-negotiable
3. **Type everything** — TypeScript strict mode, no `any`
4. **Test domain and application layers** — minimum 80% coverage
5. **Use conventional commits** for any commits made in this worktree

---

## Related Files

- [AGENTS-GGA.md](./AGENTS-GGA.md) — Code review rules for GGA (Gentleman Guardian Angel)
- [docs/GITHUB_MODELS_SETUP.md](./docs/GITHUB_MODELS_SETUP.md) — Setup guide for GitHub Models provider
