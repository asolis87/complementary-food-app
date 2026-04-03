---
name: git-workflow
description: >
  Git workflow conventions for Vera Sesiom: branching strategy, conventional commits, PR process, and release flow.
  Trigger: When creating branches, writing commits, opening PRs, or managing releases.
license: proprietary
metadata:
  author: vera-sesiom
  version: "1.0"
---

## When to Use

- Creating a new branch for any work
- Writing commit messages
- Opening or reviewing pull requests
- Preparing a release
- Resolving merge conflicts

---

## Critical Rules

1. **Conventional Commits are mandatory** — every commit MUST follow the format
2. **Branch naming MUST follow the convention** — no exceptions
3. **Every PR MUST link an issue or ticket**
4. **No direct pushes to `main` or `develop`** — always through PR
5. **Squash merge to `main`** — keep history clean
6. **Rebase onto target branch before PR** — no merge commits in feature branches

---

## Branching Strategy

### Branch Types

```
main              # Production-ready code. Protected.
develop           # Integration branch. Protected.
feat/*            # New features
fix/*             # Bug fixes
hotfix/*          # Urgent production fixes (branch from main)
chore/*           # Maintenance, dependencies, tooling
docs/*            # Documentation only
refactor/*        # Code restructuring without behavior change
test/*            # Test additions or fixes
ci/*              # CI/CD pipeline changes
release/*         # Release preparation
```

### Branch Naming

```
^(feat|fix|hotfix|chore|docs|refactor|test|ci|release)\/[a-z0-9][a-z0-9._-]*$
```

Examples:
- `feat/user-authentication`
- `fix/login-redirect-loop`
- `hotfix/payment-gateway-timeout`
- `chore/upgrade-vue-3.5`

### Flow

```
main ← release/* ← develop ← feat/* | fix/* | chore/*
main ← hotfix/* (urgent only)
```

1. Create feature branch from `develop`
2. Work, commit, push
3. Rebase onto `develop` before PR
4. PR to `develop` — requires 1 approval + CI green
5. When ready to release: `release/x.y.z` from `develop`
6. PR `release/*` to `main` — tag with version
7. Merge back to `develop`

---

## Conventional Commits

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

| Type | When to Use |
|------|------------|
| `feat` | New feature for the user |
| `fix` | Bug fix |
| `docs` | Documentation changes only |
| `style` | Formatting, missing semicolons (no logic change) |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `test` | Adding or correcting tests |
| `build` | Build system or external dependencies |
| `ci` | CI/CD configuration |
| `chore` | Maintenance tasks |
| `revert` | Reverts a previous commit |

### Scopes (by project area)

| Scope | Area |
|-------|------|
| `auth` | Authentication/Authorization |
| `user` | User management |
| `api` | API layer |
| `ui` | UI components |
| `db` | Database/migrations |
| `infra` | Infrastructure |
| `deps` | Dependencies |
| `config` | Configuration |

### Examples

```
feat(auth): add JWT refresh token rotation

fix(user): prevent duplicate email registration
Closes #123

refactor(api): extract validation middleware from controllers

chore(deps): upgrade typescript to 5.4
```

### Breaking Changes

```
feat(api)!: change user endpoint response format

BREAKING CHANGE: GET /users now returns paginated response.
Migration: Update all clients to handle { data: [], meta: {} } format.
```

---

## Pull Request Process

### PR Title

Same format as conventional commits:
```
feat(auth): add social login with Google OAuth
```

### PR Template

```markdown
## What

Brief description of WHAT changed.

## Why

WHY this change is needed. Link to issue/ticket.

Closes #<issue-number>

## How

HOW it was implemented. Key decisions.

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests if applicable
- [ ] Manual testing done

## Checklist

- [ ] Follows Vera Sesiom conventions
- [ ] No console.log or debug code
- [ ] No hardcoded secrets or credentials
- [ ] Documentation updated if needed
- [ ] Rebased onto target branch
```

### Review Rules

- Minimum **1 approval** required
- CI pipeline MUST pass (lint, test, build)
- No self-merging (except hotfixes with post-merge review)
- Reviewer MUST check architecture compliance (hexagonal layers, naming)

---

## Release Process

### Versioning

Semantic Versioning (SemVer): `MAJOR.MINOR.PATCH`

| Change Type | Version Bump | Example |
|------------|-------------|---------|
| Breaking change | MAJOR | 2.0.0 |
| New feature | MINOR | 1.3.0 |
| Bug fix | PATCH | 1.2.4 |

### Steps

1. Create `release/x.y.z` from `develop`
2. Update CHANGELOG.md
3. Bump version in package.json / pubspec.yaml
4. PR to `main` — tag: `vx.y.z`
5. Merge `main` back to `develop`

---

## Commands

```bash
# Create feature branch
git checkout develop && git pull && git checkout -b feat/my-feature

# Rebase before PR
git fetch origin && git rebase origin/develop

# Amend last commit (before push only)
git commit --amend --no-edit

# Interactive rebase to clean up commits
git rebase -i origin/develop

# Create release tag
git tag -a v1.2.0 -m "Release v1.2.0"
```
