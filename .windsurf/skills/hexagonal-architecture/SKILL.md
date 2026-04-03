---
name: hexagonal-architecture
description: >
  Hexagonal Architecture (Ports and Adapters) patterns for Vera Sesiom. Stack-agnostic principles for all projects.
  Trigger: When designing module structure, creating use cases, defining ports/adapters, or reviewing architecture compliance.
license: proprietary
metadata:
  author: vera-sesiom
  version: "1.0"
---

## When to Use

- Starting a new project or module
- Creating use cases, repositories, or services
- Defining interfaces (ports) and implementations (adapters)
- Reviewing code for architecture compliance
- Deciding where new code belongs

---

## Critical Rules

1. **Domain MUST NOT import from infrastructure or application layers** — NEVER
2. **Use cases orchestrate domain logic** — they are the APPLICATION layer, not the domain
3. **Ports are interfaces defined IN the domain** — they describe what the domain NEEDS
4. **Adapters live OUTSIDE the domain** — they implement ports with concrete technology
5. **Dependencies point INWARD** — outer layers depend on inner layers, never the reverse
6. **No framework code in domain** — no decorators, no ORM entities, no HTTP concepts
7. **One use case = one file = one public method (`execute`)** — no god use cases

---

## Layer Model

```
┌─────────────────────────────────────────────┐
│              INFRASTRUCTURE                  │
│  (Adapters: DB, HTTP, Queue, External APIs)  │
├─────────────────────────────────────────────┤
│              APPLICATION                     │
│  (Use Cases, DTOs, Application Services)     │
├─────────────────────────────────────────────┤
│              DOMAIN                          │
│  (Entities, Value Objects, Ports, Events)    │
└─────────────────────────────────────────────┘

Dependencies: Infrastructure → Application → Domain
                  ↓                ↓            ↓
              Depends on      Depends on     Depends on
              Application     Domain         NOTHING
```

### Domain Layer (innermost)

The **heart** of the application. Pure business logic. Zero dependencies on external libs.

Contains:
- **Entities**: Core business objects with identity
- **Value Objects**: Immutable objects defined by their attributes
- **Ports**: Interfaces that define what the domain needs from the outside world
- **Domain Events**: Things that happened in the domain
- **Domain Services**: Logic that doesn't belong to a single entity
- **Exceptions**: Domain-specific errors

### Application Layer (middle)

Orchestrates use cases. Calls domain objects and ports. Knows WHAT to do, not HOW.

Contains:
- **Use Cases**: One per business operation
- **DTOs**: Data Transfer Objects (input/output boundaries)
- **Application Services**: Shared logic between use cases (transactions, etc.)
- **Mappers**: Transform between DTOs and domain entities

### Infrastructure Layer (outermost)

Implements ports. Talks to the real world.

Contains:
- **Repository Implementations**: Database adapters
- **HTTP Controllers**: REST/GraphQL endpoints
- **External Service Adapters**: Third-party APIs
- **Queue Adapters**: Message brokers
- **Framework Configuration**: DI setup, middleware

---

## Folder Structure (Screaming Architecture)

The folder structure SCREAMS the business domain, not the technology:

```
src/
├── users/                          # Domain module: Users
│   ├── domain/
│   │   ├── entities/
│   │   │   └── user.entity.ts
│   │   ├── value-objects/
│   │   │   └── email.vo.ts
│   │   ├── ports/
│   │   │   ├── user.repository.ts          # Outbound port
│   │   │   └── email-sender.port.ts        # Outbound port
│   │   ├── events/
│   │   │   └── user-created.event.ts
│   │   └── exceptions/
│   │       └── user-not-found.exception.ts
│   ├── application/
│   │   ├── use-cases/
│   │   │   ├── create-user.use-case.ts
│   │   │   └── get-user-by-id.use-case.ts
│   │   ├── dtos/
│   │   │   ├── create-user.dto.ts
│   │   │   └── user-response.dto.ts
│   │   └── mappers/
│   │       └── user.mapper.ts
│   └── infrastructure/
│       ├── adapters/
│       │   ├── user.repository.impl.ts     # Implements port
│       │   └── ses-email-sender.adapter.ts  # Implements port
│       ├── controllers/
│       │   └── user.controller.ts
│       └── persistence/
│           └── user.schema.ts              # ORM/DB schema
├── orders/                         # Domain module: Orders
│   ├── domain/
│   ├── application/
│   └── infrastructure/
└── shared/                         # Cross-cutting concerns
    ├── domain/
    │   └── value-objects/
    │       └── uuid.vo.ts
    ├── application/
    │   └── interfaces/
    │       └── use-case.interface.ts
    └── infrastructure/
        ├── config/
        ├── middleware/
        └── database/
```

---

## Patterns

### Use Case Pattern

```typescript
// application/use-cases/create-user.use-case.ts
export class CreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,   // Port (interface)
    private readonly emailSender: EmailSenderPort,     // Port (interface)
  ) {}

  async execute(dto: CreateUserDto): Promise<UserResponseDto> {
    const email = Email.create(dto.email);             // Value Object validates
    const user = User.create({ name: dto.name, email });
    
    await this.userRepository.save(user);
    await this.emailSender.sendWelcome(user.email);
    
    return UserMapper.toResponse(user);
  }
}
```

### Port Pattern (Interface)

```typescript
// domain/ports/user.repository.ts
export interface UserRepository {
  save(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
}
```

### Adapter Pattern (Implementation)

```typescript
// infrastructure/adapters/user.repository.impl.ts
export class UserRepositoryImpl implements UserRepository {
  constructor(private readonly db: DatabaseClient) {}

  async save(user: User): Promise<void> {
    await this.db.users.create({
      data: UserPersistenceMapper.toPersistence(user),
    });
  }

  async findById(id: string): Promise<User | null> {
    const raw = await this.db.users.findUnique({ where: { id } });
    return raw ? UserPersistenceMapper.toDomain(raw) : null;
  }
}
```

### Value Object Pattern

```typescript
// domain/value-objects/email.vo.ts
export class Email {
  private constructor(private readonly value: string) {}

  static create(value: string): Email {
    if (!Email.isValid(value)) {
      throw new InvalidEmailException(value);
    }
    return new Email(value);
  }

  private static isValid(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
```

---

## Dependency Rule Violations (Anti-patterns)

| Violation | Why It's Wrong | Fix |
|-----------|---------------|-----|
| Domain imports `prisma` | Domain depends on infrastructure | Create a port interface, implement in infrastructure |
| Use case imports `express.Request` | Application depends on framework | Use DTOs as input/output boundary |
| Entity has `@Column()` decorator | Domain coupled to ORM | Separate domain entity from persistence model |
| Controller contains business logic | Infrastructure has domain logic | Move logic to use case |
| Use case calls another use case | Tight coupling between use cases | Extract shared logic to domain service |

---

## Monolith-to-Microservices Readiness

Each domain module (users, orders, etc.) is a **bounded context**:

- **Own domain, application, infrastructure layers**
- **Communicates with other modules through ports** (not direct imports)
- **Can be extracted to its own service** by:
  1. Replacing in-memory port implementations with HTTP/Queue adapters
  2. Setting up its own database
  3. Deploying independently

This is WHY hexagonal architecture matters — the boundaries are already there.

---

## Commands

```bash
# Verify no domain → infrastructure imports (Node/TS)
grep -r "from.*infrastructure" src/*/domain/ --include="*.ts"
# Should return NOTHING

# Verify no application → infrastructure imports
grep -r "from.*infrastructure" src/*/application/ --include="*.ts"
# Should return NOTHING (except DI setup)
```
