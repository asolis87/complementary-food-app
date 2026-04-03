---
trigger: always_on
---

# Vera Sesiom — Agent Skills Registry

This file registers all available skills for AI agents working on Vera Sesiom projects.

## How to Use

Copy the `skills/` folder to your agent's configuration directory and reference this file.
Skills are loaded automatically based on context triggers.

## Global Conventions

Before any skill, read the shared conventions:
- [Global Conventions](skills/_shared/conventions.md) — Naming, idioma, principios fundamentales

## Skills (Auto-load based on context)

When you detect any of these contexts, IMMEDIATELY load the corresponding skill BEFORE writing any code.

| Context | Skill | Location |
|---------|-------|----------|
| Git branches, commits, PRs, releases | `git-workflow` | [SKILL.md](skills/git-workflow/SKILL.md) |
| Architecture layers, ports, adapters, use cases | `hexagonal-architecture` | [SKILL.md](skills/hexagonal-architecture/SKILL.md) |
| Monorepo, workspaces, packages, turborepo | `monorepo-structure` | [SKILL.md](skills/monorepo-structure/SKILL.md) |
| UI design, Stitch, screen generation, design systems | `stitch-designer` | [SKILL.md](skills/stitch-designer/SKILL.md) |
| Astro sites, landing pages, static content, SSG | `astro-landing` | [SKILL.md](skills/astro-landing/SKILL.md) |
| Vue components, composables, Pinia stores | `vue-frontend` | [SKILL.md](skills/vue-frontend/SKILL.md) |
| Node.js backend, Express, Fastify, Prisma | `node-backend` | [SKILL.md](skills/node-backend/SKILL.md) |
| Flutter widgets, Riverpod, Dart code | `flutter-mobile` | [SKILL.md](skills/flutter-mobile/SKILL.md) |
| Writing tests, test strategy, coverage | `testing-strategy` | [SKILL.md](skills/testing-strategy/SKILL.md) |
| Code review, PR review, review checklist | `code-review` | [SKILL.md](skills/code-review/SKILL.md) |
| API endpoints, REST design, error handling | `api-design` | [SKILL.md](skills/api-design/SKILL.md) |
| AWS resources, CDK, Lambda, managed services | `aws-infra` | [SKILL.md](skills/aws-infra/SKILL.md) |
| VPS, Dokploy, Docker deployments, self-hosted | `vps-dokploy` | [SKILL.md](skills/vps-dokploy/SKILL.md) |
| Authentication, secrets, security, validation | `security-practices` | [SKILL.md](skills/security-practices/SKILL.md) |
| Documentation, ADRs, changelogs, README | `documentation-standards` | [SKILL.md](skills/documentation-standards/SKILL.md) |
| New team member, project setup, onboarding | `onboarding` | [SKILL.md](skills/onboarding/SKILL.md) |

## Skill Loading Priority

When multiple skills apply, load them in this order:

1. **Architecture** — `hexagonal-architecture` (always applies)
2. **Structure** — `monorepo-structure` (always applies)
3. **Design** — `stitch-designer` (when UI design is needed)
4. **Stack** — `astro-landing` / `vue-frontend` / `node-backend` / `flutter-mobile`
5. **Quality** — `testing-strategy` / `code-review`
6. **Domain** — `api-design` / `security-practices` / `aws-infra` / `vps-dokploy`
7. **Process** — `git-workflow` / `documentation-standards`

## Rules for Agents

1. **ALWAYS read `_shared/conventions.md` first** — global naming and coding conventions
2. **Load relevant skills BEFORE writing code** — never code first, understand first
3. **Follow hexagonal architecture** — this is non-negotiable
4. **Use conventional commits** — see `git-workflow` skill
5. **Type everything** — TypeScript strict mode, no `any`
6. **Test domain and application layers** — minimum 80% coverage
