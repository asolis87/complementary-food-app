---
name: code-review
description: >
  Code review checklist and criteria for Vera Sesiom. Guidelines for reviewers and PR authors.
  Trigger: When reviewing a pull request, preparing code for review, or establishing review standards.
license: proprietary
metadata:
  author: vera-sesiom
  version: "1.0"
---

## When to Use

- Reviewing a pull request
- Preparing code for review (self-review)
- Setting up review guidelines for a team
- Training new reviewers

---

## Critical Rules

1. **Every PR requires at least 1 approval** before merge
2. **CI MUST pass** — no merging with failing tests/lint
3. **Reviewers check ARCHITECTURE first, style second**
4. **Be kind but honest** — the goal is code quality, not ego
5. **If it's not in the review checklist, it's not a blocker**

---

## Review Checklist

### Architecture (MUST)

- [ ] Hexagonal layers respected (domain → application → infrastructure)
- [ ] No domain imports from infrastructure
- [ ] Use cases have single responsibility
- [ ] DTOs used at API boundaries (no domain entities exposed)
- [ ] New code is in the correct module (screaming architecture)

### Code Quality (MUST)

- [ ] TypeScript strict — no `any`, no `@ts-ignore` without justification
- [ ] No hardcoded values — use config/constants
- [ ] No `console.log` or debug code
- [ ] No commented-out code (delete it, git has history)
- [ ] Error handling is proper (domain exceptions, not generic catches)

### Naming (MUST)

- [ ] Follows Vera Sesiom naming conventions (see `_shared/conventions.md`)
- [ ] File suffixes correct (`.use-case.ts`, `.repository.ts`, etc.)
- [ ] Variables and functions are descriptive

### Testing (MUST)

- [ ] New use cases have unit tests
- [ ] Tests follow AAA pattern
- [ ] Test names describe behavior
- [ ] No tests that depend on other tests

### Security (MUST)

- [ ] No secrets or credentials in code
- [ ] Input validation at API boundaries
- [ ] SQL injection prevention (parameterized queries)
- [ ] Auth checks where needed

### Performance (SHOULD)

- [ ] No N+1 queries
- [ ] Pagination for list endpoints
- [ ] Appropriate caching strategy
- [ ] No unnecessary re-renders (frontend)

### Documentation (SHOULD)

- [ ] Complex logic has comments explaining WHY (not what)
- [ ] Public APIs have JSDoc/dartdoc
- [ ] Breaking changes documented
- [ ] ADR created for significant architectural decisions

---

## Review Tones

| Prefix | Meaning |
|--------|---------|
| `blocker:` | Must fix before merge |
| `suggestion:` | Would improve the code, not required |
| `question:` | Need clarification to continue review |
| `nit:` | Very minor style preference, fix if easy |
| `praise:` | Something done really well |

### Examples

```
blocker: Domain entity imports Prisma — this violates hexagonal architecture.
Move the ORM-specific logic to the infrastructure layer adapter.

suggestion: Consider extracting this validation to a Value Object.
It would make the email validation reusable and testable.

nit: Prefer `const` over `let` here since the value never changes.

praise: Great use of the mapper pattern here — clean separation between
domain and persistence models.
```

---

## Self-Review Before PR

Before opening a PR, the author SHOULD:

1. Re-read the full diff themselves
2. Remove any debug/temporary code
3. Run tests locally
4. Check the PR template is filled in
5. Verify branch is rebased onto target
