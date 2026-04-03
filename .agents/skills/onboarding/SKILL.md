---
name: onboarding
description: >
  Onboarding guide for new developers and AI agents joining Vera Sesiom projects.
  Trigger: When a new team member joins, an AI agent needs project context, or someone needs to understand how Vera Sesiom works.
license: proprietary
metadata:
  author: vera-sesiom
  version: "1.0"
---

## When to Use

- A new developer joins the team
- An AI agent starts working on a Vera Sesiom project for the first time
- Someone needs a refresher on how things work
- Setting up a development environment from scratch

---

## Welcome to Vera Sesiom

Vera Sesiom is a software development and digital solutions company. We build products using modern technologies with a strong focus on clean architecture, maintainability, and developer experience.

---

## Our Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Vue 3 (Composition API, TypeScript) | Reactive, lightweight, great DX |
| Backend | Node.js (TypeScript, Express/Fastify) | Same language as frontend, vast ecosystem |
| Mobile | Flutter (Dart) | Cross-platform, beautiful UI, strong typing |
| Infrastructure | AWS (CDK for IaC) | Market leader, comprehensive services |
| Architecture | Hexagonal + Screaming Architecture | Clean boundaries, domain-focused |
| Project Structure | Monorepo (pnpm + Turborepo) | Shared code, unified tooling |

---

## Our Principles

1. **Concepts over code** — Understand the WHY before writing the HOW
2. **Solid foundations** — Architecture, patterns, and principles FIRST
3. **Domain-driven structure** — The code screams the business, not the framework
4. **Monolith-first** — Start simple, extract when proven necessary
5. **Test what matters** — Domain and application logic always tested
6. **Automate everything** — CI/CD, linting, formatting, testing

---

## First Day Setup

### Prerequisites

- [ ] Git configured with company email
- [ ] Node.js >= 20 installed (use `nvm` or `fnm`)
- [ ] pnpm >= 9 installed
- [ ] Docker Desktop installed and running
- [ ] Flutter SDK installed (for mobile projects)
- [ ] IDE: VS Code or equivalent with extensions
- [ ] Access to GitHub organization
- [ ] Access to AWS console (if needed)

### IDE Extensions (VS Code)

- Vue — Official (Volar)
- TypeScript
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Dart & Flutter (for mobile)
- Prisma

### Clone and Run

```bash
# Clone the project
git clone git@github.com:vera-sesiom/{project-name}.git
cd {project-name}

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Start development database (Docker)
docker compose up -d

# Run database migrations
pnpm --filter @vera-sesiom/api prisma migrate dev

# Start all apps in development
pnpm dev
```

---

## Skills to Read First

Read these skills in this order to understand how we work:

### 1. Architecture (Read First)
1. **[hexagonal-architecture](../hexagonal-architecture/SKILL.md)** — How we structure ALL code
2. **[monorepo-structure](../monorepo-structure/SKILL.md)** — How projects are organized

### 2. Stack-Specific (Read Your Stack)
3. **[vue-frontend](../vue-frontend/SKILL.md)** — If working on frontend
4. **[node-backend](../node-backend/SKILL.md)** — If working on backend
5. **[flutter-mobile](../flutter-mobile/SKILL.md)** — If working on mobile

### 3. Process (Read as Needed)
6. **[git-workflow](../git-workflow/SKILL.md)** — How we use Git
7. **[testing-strategy](../testing-strategy/SKILL.md)** — How we test
8. **[code-review](../code-review/SKILL.md)** — How we review PRs
9. **[api-design](../api-design/SKILL.md)** — How we design APIs
10. **[security-practices](../security-practices/SKILL.md)** — Security standards

---

## For AI Agents

If you're an AI agent working on a Vera Sesiom project:

1. **Load the relevant skills** before writing any code
2. **Follow hexagonal architecture** — domain/application/infrastructure layers
3. **Use the naming conventions** from `_shared/conventions.md`
4. **Check the project's ADRs** for past architectural decisions
5. **Run tests** before considering work done
6. **Follow git conventions** — conventional commits, branch naming

### Quick Reference

| I need to... | Skill to check |
|-------------|---------------|
| Create a new feature | `hexagonal-architecture` + stack-specific skill |
| Write a test | `testing-strategy` |
| Open a PR | `git-workflow` |
| Design an API endpoint | `api-design` |
| Handle authentication | `security-practices` |
| Add AWS resources | `aws-infra` |
| Document a decision | `documentation-standards` |

---

## Key Contacts

| Role | Responsibility |
|------|---------------|
| Tech Lead | Architecture decisions, code review, mentoring |
| Project Manager | Requirements, priorities, deadlines |
| DevOps Lead | Infrastructure, CI/CD, deployments |

---

## Common Gotchas

1. **Always use `pnpm`** — not npm or yarn
2. **Always work from `develop`** — never branch from `main` (except hotfixes)
3. **Run `pnpm install` after pulling** — dependencies might have changed
4. **Check `.env.example` after pulling** — new env vars might be needed
5. **TypeScript strict mode is ON** — no shortcuts, type everything
6. **Prisma generate after schema changes** — `pnpm --filter @vera-sesiom/api prisma generate`
