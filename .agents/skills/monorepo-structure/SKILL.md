---
name: monorepo-structure
description: >
  Monorepo structure conventions for Vera Sesiom using pnpm workspaces and Turborepo.
  Trigger: When creating a new project, adding packages to a monorepo, or configuring workspace dependencies.
license: proprietary
metadata:
  author: vera-sesiom
  version: "1.0"
---

## When to Use

- Starting a new project (all projects start as monorepos)
- Adding a new app or package to an existing monorepo
- Configuring shared packages between apps
- Setting up CI/CD pipelines for monorepos
- Deciding where new code should live

---

## Critical Rules

1. **pnpm workspaces + Turborepo** — this is the standard, no exceptions
2. **Apps go in `apps/`** — deployable applications
3. **Packages go in `packages/`** — shared libraries
4. **Each workspace MUST have its own `package.json`** with proper name scope
5. **Scope is `@vera-sesiom/`** for all internal packages
6. **No hoisting of dependencies** — each workspace manages its own
7. **Turborepo pipelines define task dependencies** — build order is explicit

---

## Folder Structure

```
project-root/
├── apps/
│   ├── web/                        # Vue 3 frontend
│   │   ├── src/
│   │   ├── package.json            # @vera-sesiom/web
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   ├── api/                        # Node.js backend
│   │   ├── src/
│   │   ├── package.json            # @vera-sesiom/api
│   │   └── tsconfig.json
│   └── mobile/                     # Flutter app (if applicable)
│       ├── lib/
│       └── pubspec.yaml
├── packages/
│   ├── shared-types/               # TypeScript types shared between apps
│   │   ├── src/
│   │   ├── package.json            # @vera-sesiom/shared-types
│   │   └── tsconfig.json
│   ├── ui-kit/                     # Shared Vue components (if needed)
│   │   ├── src/
│   │   ├── package.json            # @vera-sesiom/ui-kit
│   │   └── tsconfig.json
│   ├── utils/                      # Shared utilities
│   │   ├── src/
│   │   ├── package.json            # @vera-sesiom/utils
│   │   └── tsconfig.json
│   └── config/                     # Shared configs (ESLint, TSConfig, Prettier)
│       ├── eslint/
│       ├── typescript/
│       └── package.json            # @vera-sesiom/config
├── turbo.json                      # Turborepo pipeline config
├── pnpm-workspace.yaml             # Workspace definition
├── package.json                    # Root package.json (scripts only)
├── .npmrc                          # pnpm config
└── tsconfig.base.json              # Base TypeScript config
```

---

## Configuration Files

### pnpm-workspace.yaml

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

### Root package.json

```json
{
  "name": "@vera-sesiom/root",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "test": "turbo test",
    "lint": "turbo lint",
    "type-check": "turbo type-check",
    "clean": "turbo clean"
  },
  "devDependencies": {
    "turbo": "^2.0.0"
  },
  "packageManager": "pnpm@9.0.0"
}
```

### turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "build/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "lint": {},
    "type-check": {
      "dependsOn": ["^build"]
    },
    "clean": {
      "cache": false
    }
  }
}
```

### .npmrc

```
auto-install-peers=true
strict-peer-dependencies=false
```

---

## Package Naming

| Type | Pattern | Example |
|------|---------|---------|
| App | `@vera-sesiom/{app-name}` | `@vera-sesiom/web` |
| Shared package | `@vera-sesiom/{package-name}` | `@vera-sesiom/shared-types` |
| Config package | `@vera-sesiom/config` | `@vera-sesiom/config` |

---

## When to Create a Package

| Scenario | Where |
|----------|-------|
| Code shared between 2+ apps | `packages/` |
| Types/interfaces shared between frontend and backend | `packages/shared-types/` |
| Shared UI components | `packages/ui-kit/` |
| Shared utilities (date, string, validation) | `packages/utils/` |
| Config (ESLint, TSConfig, Prettier) | `packages/config/` |
| Code used by ONE app only | Inside that app's `src/` |

**Rule**: Don't create a package until at least 2 apps need it. Premature abstraction is worse than duplication.

---

## Inter-Package Dependencies

```json
// apps/web/package.json
{
  "dependencies": {
    "@vera-sesiom/shared-types": "workspace:*",
    "@vera-sesiom/ui-kit": "workspace:*"
  }
}
```

Always use `workspace:*` for internal dependencies.

---

## Commands

```bash
# Install all dependencies
pnpm install

# Add dependency to specific workspace
pnpm add axios --filter @vera-sesiom/api

# Add dev dependency to specific workspace
pnpm add -D vitest --filter @vera-sesiom/web

# Run script in specific workspace
pnpm --filter @vera-sesiom/web dev

# Run all tests
pnpm turbo test

# Build all (respects dependency order)
pnpm turbo build

# Clean all build artifacts
pnpm turbo clean
```
