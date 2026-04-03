---
name: node-backend
description: >
  Node.js backend conventions for Vera Sesiom. TypeScript, Hexagonal Architecture, Express/Fastify, and modular monolith patterns.
  Trigger: When writing backend code, creating APIs, use cases, repositories, or structuring a Node.js project.
license: proprietary
metadata:
  author: vera-sesiom
  version: "1.0"
---

## When to Use

- Creating or modifying Node.js backend code
- Setting up a new API project
- Writing use cases, services, or repositories
- Configuring database connections, middleware, or DI
- Reviewing backend code for architecture compliance

---

## Critical Rules

1. **TypeScript ALWAYS** — strict mode enabled, no `any`
2. **Hexagonal Architecture** — domain/application/infrastructure layers respected
3. **Express or Fastify** — choose one per project and stick with it
4. **Prisma as ORM** — unless specific reason for another
5. **Dependency Injection via constructor** — no service locators, no global singletons
6. **Every use case has ONE `execute()` method** — no multi-purpose use cases
7. **DTOs at boundaries** — never expose domain entities through API responses
8. **Environment variables through config module** — never `process.env` directly in code
9. **Error handling with domain exceptions** — not HTTP errors in domain/application

---

## Project Structure

```
apps/api/
├── src/
│   ├── modules/                        # Domain modules (Screaming Architecture)
│   │   ├── users/
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   └── user.entity.ts
│   │   │   │   ├── value-objects/
│   │   │   │   │   └── email.vo.ts
│   │   │   │   ├── ports/
│   │   │   │   │   └── user.repository.ts
│   │   │   │   ├── events/
│   │   │   │   │   └── user-created.event.ts
│   │   │   │   └── exceptions/
│   │   │   │       └── user-not-found.exception.ts
│   │   │   ├── application/
│   │   │   │   ├── use-cases/
│   │   │   │   │   ├── create-user.use-case.ts
│   │   │   │   │   └── get-user-by-id.use-case.ts
│   │   │   │   ├── dtos/
│   │   │   │   │   ├── create-user.dto.ts
│   │   │   │   │   └── user-response.dto.ts
│   │   │   │   └── mappers/
│   │   │   │       └── user.mapper.ts
│   │   │   └── infrastructure/
│   │   │       ├── adapters/
│   │   │       │   └── user.repository.impl.ts
│   │   │       ├── controllers/
│   │   │       │   └── user.controller.ts
│   │   │       ├── routes/
│   │   │       │   └── user.routes.ts
│   │   │       ├── persistence/
│   │   │       │   └── user.schema.prisma
│   │   │       └── validators/
│   │   │           └── create-user.validator.ts
│   │   ├── auth/
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   └── infrastructure/
│   │   └── orders/
│   ├── shared/
│   │   ├── domain/
│   │   │   ├── value-objects/
│   │   │   │   └── uuid.vo.ts
│   │   │   └── exceptions/
│   │   │       └── domain.exception.ts
│   │   ├── application/
│   │   │   └── interfaces/
│   │   │       └── use-case.interface.ts
│   │   └── infrastructure/
│   │       ├── config/
│   │       │   └── env.config.ts
│   │       ├── middleware/
│   │       │   ├── error-handler.middleware.ts
│   │       │   ├── auth.middleware.ts
│   │       │   └── validation.middleware.ts
│   │       ├── database/
│   │       │   └── prisma.client.ts
│   │       ├── di/
│   │       │   └── container.ts
│   │       └── server/
│   │           └── app.ts
│   └── main.ts                         # Entry point
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── package.json
├── tsconfig.json
└── .env.example
```

---

## Patterns

### Use Case Interface

```typescript
// shared/application/interfaces/use-case.interface.ts
export interface UseCase<Input, Output> {
  execute(input: Input): Promise<Output>
}
```

### Controller Pattern

```typescript
// modules/users/infrastructure/controllers/user.controller.ts
import type { Request, Response, NextFunction } from 'express'
import type { CreateUserUseCase } from '../../application/use-cases/create-user.use-case'
import type { GetUserByIdUseCase } from '../../application/use-cases/get-user-by-id.use-case'

export class UserController {
  constructor(
    private readonly createUser: CreateUserUseCase,
    private readonly getUserById: GetUserByIdUseCase,
  ) {}

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.createUser.execute(req.body)
      res.status(201).json(result)
    } catch (error) {
      next(error)
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.getUserById.execute({ id: req.params.id })
      res.status(200).json(result)
    } catch (error) {
      next(error)
    }
  }
}
```

### Route Registration

```typescript
// modules/users/infrastructure/routes/user.routes.ts
import { Router } from 'express'
import type { UserController } from '../controllers/user.controller'
import { validateBody } from '@/shared/infrastructure/middleware/validation.middleware'
import { createUserSchema } from '../validators/create-user.validator'

export function createUserRoutes(controller: UserController): Router {
  const router = Router()

  router.post('/', validateBody(createUserSchema), (req, res, next) =>
    controller.create(req, res, next)
  )
  router.get('/:id', (req, res, next) =>
    controller.getById(req, res, next)
  )

  return router
}
```

### Error Handling

```typescript
// shared/domain/exceptions/domain.exception.ts
export abstract class DomainException extends Error {
  abstract readonly code: string
  abstract readonly httpStatus: number

  constructor(message: string) {
    super(message)
    this.name = this.constructor.name
  }
}

// modules/users/domain/exceptions/user-not-found.exception.ts
export class UserNotFoundException extends DomainException {
  readonly code = 'USER_NOT_FOUND'
  readonly httpStatus = 404

  constructor(id: string) {
    super(`User with id "${id}" not found`)
  }
}

// shared/infrastructure/middleware/error-handler.middleware.ts
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof DomainException) {
    return res.status(err.httpStatus).json({
      error: { code: err.code, message: err.message },
    })
  }

  console.error('Unhandled error:', err)
  return res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
  })
}
```

### Environment Config

```typescript
// shared/infrastructure/config/env.config.ts
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRATION: z.string().default('15m'),
})

export const env = envSchema.parse(process.env)
```

---

## Dependency Injection

Manual DI through a composition root — simple, explicit, no magic:

```typescript
// shared/infrastructure/di/container.ts
import { PrismaClient } from '@prisma/client'
import { UserRepositoryImpl } from '@/modules/users/infrastructure/adapters/user.repository.impl'
import { CreateUserUseCase } from '@/modules/users/application/use-cases/create-user.use-case'
import { UserController } from '@/modules/users/infrastructure/controllers/user.controller'

const prisma = new PrismaClient()

// Repositories (adapters)
const userRepository = new UserRepositoryImpl(prisma)

// Use Cases
const createUserUseCase = new CreateUserUseCase(userRepository)
const getUserByIdUseCase = new GetUserByIdUseCase(userRepository)

// Controllers
export const userController = new UserController(createUserUseCase, getUserByIdUseCase)
```

---

## Validation

Use **Zod** for runtime validation at the API boundary:

```typescript
// modules/users/infrastructure/validators/create-user.validator.ts
import { z } from 'zod'

export const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  role: z.enum(['admin', 'editor', 'viewer']),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
```

---

## Anti-Patterns

| Anti-Pattern | Fix |
|-------------|-----|
| `process.env.X` scattered in code | Use centralized `env.config.ts` with Zod |
| Business logic in controllers | Move to use cases |
| Prisma models as API response | Map to DTOs |
| Try-catch in every controller method | Use error handling middleware |
| Global `new PrismaClient()` | Inject through DI container |
| Use case calling another use case | Extract to domain service |

---

## Commands

```bash
# Generate Prisma client
pnpm --filter @vera-sesiom/api prisma generate

# Run migrations
pnpm --filter @vera-sesiom/api prisma migrate dev

# Seed database
pnpm --filter @vera-sesiom/api prisma db seed

# Dev with hot reload
pnpm --filter @vera-sesiom/api dev

# Build
pnpm --filter @vera-sesiom/api build
```
