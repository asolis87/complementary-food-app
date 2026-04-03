---
name: testing-strategy
description: >
  Testing strategy and conventions for Vera Sesiom across all stacks (Vue, Node, Flutter).
  Trigger: When writing tests, setting up testing infrastructure, or deciding testing approach.
license: proprietary
metadata:
  author: vera-sesiom
  version: "1.0"
---

## When to Use

- Writing unit, integration, or e2e tests
- Setting up testing infrastructure in a new project
- Deciding what to test and at what level
- Reviewing test quality and coverage
- Configuring CI test pipelines

---

## Critical Rules

1. **Every use case MUST have unit tests** — no exceptions
2. **Tests follow the Arrange-Act-Assert (AAA) pattern**
3. **Test names describe behavior, not implementation** — `should reject duplicate email` not `test createUser`
4. **No test should depend on another test** — each test is isolated
5. **Mocking: mock ports/interfaces, NEVER mock domain logic**
6. **Minimum coverage: 80% for domain + application layers**
7. **E2E tests cover critical user flows only** — not everything

---

## Testing Pyramid

```
        ╱╲
       ╱ E2E ╲          Few, slow, expensive
      ╱────────╲         Critical flows only
     ╱Integration╲      Some, moderate speed
    ╱──────────────╲     API endpoints, DB queries
   ╱   Unit Tests    ╲   Many, fast, cheap
  ╱────────────────────╲  Domain + Application logic
```

| Level | What to Test | Speed | Count |
|-------|-------------|-------|-------|
| **Unit** | Use cases, entities, value objects, mappers | Fast | Many |
| **Integration** | Repository impls, controllers with DB, external services | Medium | Some |
| **E2E** | Full user flows (login → create → verify) | Slow | Few |

---

## Stack-Specific Tools

### Vue (Frontend)

| Tool | Purpose |
|------|---------|
| **Vitest** | Unit + component testing |
| **Vue Test Utils** | Component mounting/interaction |
| **MSW** | API mocking (Mock Service Worker) |
| **Playwright** | E2E browser testing |

### Node (Backend)

| Tool | Purpose |
|------|---------|
| **Vitest** | Unit + integration testing |
| **Supertest** | HTTP endpoint testing |
| **Testcontainers** | DB integration with real containers |
| **faker-js** | Realistic test data generation |

### Flutter (Mobile)

| Tool | Purpose |
|------|---------|
| **flutter_test** | Unit + widget testing |
| **mocktail** | Mocking (null-safe) |
| **integration_test** | Integration/E2E testing |

---

## Test Structure

### File Organization

```
# Mirrors source structure
tests/
├── unit/
│   └── modules/
│       └── users/
│           ├── domain/
│           │   └── email.vo.spec.ts
│           └── application/
│               └── create-user.use-case.spec.ts
├── integration/
│   └── modules/
│       └── users/
│           └── user.controller.spec.ts
└── e2e/
    └── user-flow.spec.ts
```

### Naming Convention

```
# Test files
create-user.use-case.spec.ts     # Node/Vue
create_user_use_case_test.dart    # Flutter

# Test suites and cases
describe('CreateUserUseCase', () => {
  it('should create a user with valid data', ...)
  it('should reject duplicate email', ...)
  it('should throw when name is empty', ...)
})
```

---

## Patterns

### Unit Test (Use Case)

```typescript
// tests/unit/modules/users/application/create-user.use-case.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CreateUserUseCase } from '@/modules/users/application/use-cases/create-user.use-case'
import type { UserRepository } from '@/modules/users/domain/ports/user.repository'

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase
  let mockRepository: UserRepository

  beforeEach(() => {
    mockRepository = {
      save: vi.fn(),
      findByEmail: vi.fn().mockResolvedValue(null),
      findById: vi.fn(),
    }
    useCase = new CreateUserUseCase(mockRepository)
  })

  it('should create a user with valid data', async () => {
    // Arrange
    const input = { name: 'John Doe', email: 'john@example.com', role: 'viewer' }

    // Act
    const result = await useCase.execute(input)

    // Assert
    expect(result.name).toBe('John Doe')
    expect(mockRepository.save).toHaveBeenCalledOnce()
  })

  it('should reject duplicate email', async () => {
    // Arrange
    mockRepository.findByEmail = vi.fn().mockResolvedValue({ id: '1', email: 'john@example.com' })
    const input = { name: 'John', email: 'john@example.com', role: 'viewer' }

    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow('already exists')
  })
})
```

### Integration Test (Controller)

```typescript
// tests/integration/modules/users/user.controller.spec.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { createApp } from '@/shared/infrastructure/server/app'

describe('UserController', () => {
  let app: Express

  beforeAll(async () => {
    app = await createApp({ testing: true })
  })

  it('POST /users should create a user', async () => {
    const response = await request(app)
      .post('/users')
      .send({ name: 'Jane', email: 'jane@example.com', role: 'viewer' })

    expect(response.status).toBe(201)
    expect(response.body.name).toBe('Jane')
  })

  it('POST /users should reject invalid email', async () => {
    const response = await request(app)
      .post('/users')
      .send({ name: 'Jane', email: 'not-an-email', role: 'viewer' })

    expect(response.status).toBe(400)
  })
})
```

### Vue Component Test

```typescript
// tests/unit/modules/users/components/UserList.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import UserList from '@/modules/users/components/UserList.vue'

describe('UserList', () => {
  it('should render user names', () => {
    const users = [
      { id: '1', name: 'Alice', email: 'alice@test.com' },
      { id: '2', name: 'Bob', email: 'bob@test.com' },
    ]

    const wrapper = mount(UserList, {
      props: { users, loading: false },
    })

    expect(wrapper.text()).toContain('Alice')
    expect(wrapper.text()).toContain('Bob')
  })

  it('should show loading state', () => {
    const wrapper = mount(UserList, {
      props: { users: [], loading: true },
    })

    expect(wrapper.text()).toContain('Loading')
  })
})
```

### Flutter Test

```dart
// test/features/users/application/use_cases/get_users_use_case_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockUserRepository extends Mock implements UserRepository {}

void main() {
  late GetUsersUseCase useCase;
  late MockUserRepository mockRepository;

  setUp(() {
    mockRepository = MockUserRepository();
    useCase = GetUsersUseCase(mockRepository);
  });

  test('should return list of users from repository', () async {
    // Arrange
    final users = [User(id: '1', name: 'Alice', email: 'alice@test.com')];
    when(() => mockRepository.getAll()).thenAnswer((_) async => users);

    // Act
    final result = await useCase.execute();

    // Assert
    expect(result, equals(users));
    verify(() => mockRepository.getAll()).called(1);
  });
}
```

---

## What NOT to Test

- Framework internals (Vue reactivity, Express routing)
- Third-party library behavior
- Trivial getters/setters
- Private methods directly (test through public API)
- Generated code (Prisma client, freezed)

---

## Commands

```bash
# Vue/Node tests
pnpm turbo test                    # All tests
pnpm --filter @vera-sesiom/api test -- --coverage  # With coverage

# Flutter tests
flutter test                       # All tests
flutter test --coverage            # With coverage

# E2E (Playwright)
pnpm --filter @vera-sesiom/web e2e
```
