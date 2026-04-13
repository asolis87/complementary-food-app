# Skill Registry — Pakulab (complementary-food)

Generated: 2026-04-13
Project: pakulab / complementary-food-app

## Project Convention Files

- AGENTS.md — Vera Sesiom skill registry index (project-level)
- CLAUDE.md — Auto-generated redirect to AGENTS.md

## Available Skills (Project-level — .agents/skills/)

| Name | Path | Trigger |
|------|------|---------|
| api-design | .agents/skills/api-design/SKILL.md | API endpoints, REST design, error handling |
| astro-landing | .agents/skills/astro-landing/SKILL.md | Astro sites, landing pages, SSG |
| aws-infra | .agents/skills/aws-infra/SKILL.md | AWS resources, CDK, Lambda |
| code-review | .agents/skills/code-review/SKILL.md | Code review, PR review, review checklist |
| documentation-standards | .agents/skills/documentation-standards/SKILL.md | Documentation, ADRs, changelogs, README |
| flutter-mobile | .agents/skills/flutter-mobile/SKILL.md | Flutter widgets, Riverpod, Dart |
| git-workflow | .agents/skills/git-workflow/SKILL.md | Git branches, commits, PRs, releases |
| hexagonal-architecture | .agents/skills/hexagonal-architecture/SKILL.md | Architecture layers, ports, adapters, use cases |
| monorepo-structure | .agents/skills/monorepo-structure/SKILL.md | Monorepo, workspaces, packages, turborepo |
| node-backend | .agents/skills/node-backend/SKILL.md | Node.js backend, Express, Fastify, Prisma |
| onboarding | .agents/skills/onboarding/SKILL.md | New team member, project setup, onboarding |
| security-practices | .agents/skills/security-practices/SKILL.md | Authentication, secrets, security, validation |
| stitch-designer | .agents/skills/stitch-designer/SKILL.md | UI design, Stitch, screen generation, design systems |
| testing-strategy | .agents/skills/testing-strategy/SKILL.md | Writing tests, test strategy, coverage |
| vps-dokploy | .agents/skills/vps-dokploy/SKILL.md | VPS, Dokploy, Docker deployments, self-hosted |
| vue-frontend | .agents/skills/vue-frontend/SKILL.md | Vue components, composables, Pinia stores |

## Available Skills (User-level — ~/.config/opencode/skills/)

| Name | Path | Trigger |
|------|------|---------|
| branch-pr | ~/.config/opencode/skills/branch-pr/SKILL.md | Creating a pull request, opening a PR |
| go-testing | ~/.config/opencode/skills/go-testing/SKILL.md | Writing Go tests, teatest, test coverage |
| issue-creation | ~/.config/opencode/skills/issue-creation/SKILL.md | Creating GitHub issues, reporting bugs |
| judgment-day | ~/.config/opencode/skills/judgment-day/SKILL.md | Adversarial dual review protocol |
| skill-creator | ~/.config/opencode/skills/skill-creator/SKILL.md | Creating new AI agent skills |
| skill-registry | ~/.config/opencode/skills/skill-registry/SKILL.md | Updating the skill registry |

## SDD Phase Skills (User-level)

| Phase | Path |
|-------|------|
| sdd-init | ~/.config/opencode/skills/sdd-init/SKILL.md |
| sdd-explore | ~/.config/opencode/skills/sdd-explore/SKILL.md |
| sdd-propose | ~/.config/opencode/skills/sdd-propose/SKILL.md |
| sdd-spec | ~/.config/opencode/skills/sdd-spec/SKILL.md |
| sdd-design | ~/.config/opencode/skills/sdd-design/SKILL.md |
| sdd-tasks | ~/.config/opencode/skills/sdd-tasks/SKILL.md |
| sdd-apply | ~/.config/opencode/skills/sdd-apply/SKILL.md |
| sdd-verify | ~/.config/opencode/skills/sdd-verify/SKILL.md |
| sdd-archive | ~/.config/opencode/skills/sdd-archive/SKILL.md |
| sdd-onboard | ~/.config/opencode/skills/sdd-onboard/SKILL.md |

## Skill Loading Priority (from AGENTS.md)

1. Architecture — hexagonal-architecture (always applies)
2. Structure — monorepo-structure (always applies)
3. Design — stitch-designer (when UI design needed)
4. Stack — astro-landing / vue-frontend / node-backend / flutter-mobile
5. Quality — testing-strategy / code-review
6. Domain — api-design / security-practices / aws-infra / vps-dokploy
7. Process — git-workflow / documentation-standards

## Project Notes

- Monorepo: pnpm workspaces, Node 20+, TypeScript strict mode, ESM
- API: Fastify 5 + Prisma + BetterAuth + Stripe (@pakulab/api)
- Web: Vue 3 + Vite + Pinia + vue-router + PWA (@pakulab/web)
- Shared: types/utils/constants (@pakulab/shared)
- Test runner: vitest (api + shared; web has NO vitest config)
- Architecture: Screaming / modular monolith (9 feature modules each side)
- SDD mode: hybrid (engram + openspec files)
- Strict TDD: enabled (vitest available for api + shared)