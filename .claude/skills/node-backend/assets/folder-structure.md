# Node Backend — Folder Structure Reference

## Complete Structure

```
apps/api/
├── src/
│   ├── modules/                        # Domain modules
│   │   └── {module-name}/
│   │       ├── domain/
│   │       │   ├── entities/           # Business entities
│   │       │   ├── value-objects/      # Immutable value objects
│   │       │   ├── ports/              # Interfaces (outbound)
│   │       │   ├── events/             # Domain events
│   │       │   └── exceptions/         # Domain-specific errors
│   │       ├── application/
│   │       │   ├── use-cases/          # One class per business operation
│   │       │   ├── dtos/               # Input/output boundaries
│   │       │   └── mappers/            # Entity ↔ DTO transformations
│   │       └── infrastructure/
│   │           ├── adapters/           # Port implementations
│   │           ├── controllers/        # HTTP controllers
│   │           ├── routes/             # Express/Fastify routes
│   │           ├── persistence/        # DB schemas, migrations
│   │           └── validators/         # Zod schemas for input
│   ├── shared/
│   │   ├── domain/
│   │   │   ├── value-objects/          # UUID, Money, etc.
│   │   │   └── exceptions/            # Base domain exception
│   │   ├── application/
│   │   │   └── interfaces/            # UseCase interface, etc.
│   │   └── infrastructure/
│   │       ├── config/                 # env.config.ts
│   │       ├── middleware/             # Error handler, auth, validation
│   │       ├── database/              # Prisma client setup
│   │       ├── di/                    # Composition root (DI container)
│   │       └── server/                # Express/Fastify app setup
│   └── main.ts                         # Entry point
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── package.json
├── tsconfig.json
└── .env.example
```

## File Naming

| Type | Convention | Example |
|------|-----------|---------|
| Entity | kebab-case + `.entity` | `user.entity.ts` |
| Value Object | kebab-case + `.vo` | `email.vo.ts` |
| Port (interface) | kebab-case + `.repository` or `.port` | `user.repository.ts` |
| Adapter | kebab-case + `.repository.impl` | `user.repository.impl.ts` |
| Use Case | kebab-case + `.use-case` | `create-user.use-case.ts` |
| DTO | kebab-case + `.dto` | `create-user.dto.ts` |
| Controller | kebab-case + `.controller` | `user.controller.ts` |
| Route | kebab-case + `.routes` | `user.routes.ts` |
| Middleware | kebab-case + `.middleware` | `auth.middleware.ts` |
| Validator | kebab-case + `.validator` | `create-user.validator.ts` |
| Mapper | kebab-case + `.mapper` | `user.mapper.ts` |
| Config | kebab-case + `.config` | `env.config.ts` |
| Test | same name + `.spec.ts` | `create-user.use-case.spec.ts` |
