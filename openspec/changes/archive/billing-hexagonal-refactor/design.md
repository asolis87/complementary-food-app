# Design: Billing Module — Hexagonal Refactor

> Status: draft
> Change: billing-hexagonal-refactor

## Architecture Decisions

### AD-BH-01: Keep Stripe SDK in Infrastructure Layer

**Decision:** The `stripe` npm package SHALL only be imported inside `infrastructure/adapters/`. No `import Stripe from 'stripe'` in domain or application layers.

**Rationale:** Hexagonal architecture mandates that domain and application layers have zero knowledge of external services. The `Stripe` SDK is an infrastructure concern. If we ever switch payment providers, only the adapter changes.

**Alternatives considered:**
- Keep Stripe in application layer (rejected — violates hexagonal)
- Abstract with a generic `PaymentGateway` interface (rejected — overengineering; KISS until we need multi-provider)

### AD-BH-02: Extract `deleteUserAccount` to Dedicated Use Case

**Decision:** `deleteUserAccount` SHALL be extracted from `billing.service.ts` to a dedicated `DeleteUserAccountUseCase` with its own `UserAccountPort`. It SHALL live in `modules/billing/application/use-cases/` but export through `UserAccountPort` so `profiles.routes.ts` depends on the port, not billing.

**Rationale:** `deleteUserAccount` is a cross-cutting GDPR concern that happens to touch billing data. It deletes ALL user data (plates, food logs, menus, profiles, sessions, accounts, subscription, user). Having `profiles.routes.ts` import from `billing.service.ts` creates an incorrect dependency: profiles depends on billing for something that isn't billing.

**Alternatives considered:**
- Move to a new `user-account` module (rejected — would create a 14th module for one function)
- Keep in billing (rejected — wrong dependency direction)

### AD-BH-03: Define Three Ports

**Decision:** The refactor SHALL extract three port interfaces in `domain/ports/`:

1. **`BillingPort`** — All Stripe operations (checkout, portal, webhook, subscription, trial)
2. **`SubscriptionRepository`** — DB queries for the Subscription model
3. **`UserAccountPort`** — Account deletion (GDPR wipe)

**Rationale:** Separation of concerns. `BillingPort` is for Stripe-specific operations. `SubscriptionRepository` is for pure data access. `UserAccountPort` is for the cross-cutting account deletion that happens to live here.

### AD-BH-04: Five Use Cases, One Per File

**Decision:** The refactor SHALL extract five use cases from `billing.service.ts`:

1. **`CreateCheckoutUseCase`** — depends on `BillingPort`, `SubscriptionRepository`
2. **`CreatePortalUseCase`** — depends on `BillingPort`, `SubscriptionRepository`
3. **`HandleWebhookUseCase`** — depends on `BillingPort`, `SubscriptionRepository`
4. **`GetSubscriptionUseCase`** — depends on `SubscriptionRepository`
5. **`StartTrialUseCase`** — depends on `SubscriptionRepository`
6. **`DeleteUserAccountUseCase`** — depends on `UserAccountPort`

**Rationale:** One use case = one file = one `execute()` method. Follows hexagonal conventions and the `.use-case.ts` suffix pattern.

### AD-BH-05: Scoped preParsing Hook Stays in Routes

**Decision:** The `preParsing` hook for Stripe webhook raw body capture SHALL remain in `infrastructure/routes/billing.routes.ts` (scoped to the plugin). It SHALL NOT move to a global plugin or adapter.

**Rationale:** The hook is scoped to `/api/billing/*` which is correct — only billing routes need raw body capture. Moving it globally would break BetterAuth's body parsing (a known issue already documented in `PROJECT_CONTEXT.md`). The hook is an HTTP concern, not a domain concern.

### AD-BH-06: Backward Compatible Exports via Barrel File

**Decision:** During migration, `modules/billing/index.ts` SHALL re-export all functions with their original names so consumers (`auth.config.ts`, `profiles.routes.ts`) can update import paths incrementally.

**Rationale:** Zero-downtime migration. The barrel file acts as a stable API surface while internals move to hexagonal structure. Once all consumers are updated, the barrel can be removed.

### AD-BH-07: PrismaClient Injection via DI Container

**Decision:** PrismaClient SHALL be injected into repository adapters via constructor. Use cases SHALL receive port interface instances (not concrete adapters). The DI container in `shared/infrastructure/di/container.ts` SHALL wire everything.

**Rationale:** Testability and hex compliance. Use cases tested with mock ports, no real Prisma or Stripe needed. Follows existing pattern from `disclaimer` and `email` modules (though the project doesn't have a formal DI container yet — this design introduces one).

---

## Target Folder Structure

```
apps/api/src/modules/billing/
├── index.ts                              # Barrel: re-exports for backward compat
├── domain/
│   ├── entities/
│   │   └── subscription.entity.ts        # Subscription domain entity
│   ├── ports/
│   │   ├── billing.port.ts               # BillingPort interface
│   │   ├── subscription.repository.ts    # SubscriptionRepository interface
│   │   └── user-account.port.ts          # UserAccountPort interface
│   ├── value-objects/
│   │   └── subscription-status.vo.ts     # SubscriptionStatus value object
│   └── exceptions/
│       ├── duplicate-subscription.exception.ts
│       └── missing-stripe-customer.exception.ts
├── application/
│   ├── use-cases/
│   │   ├── create-checkout.use-case.ts   # CreateCheckoutUseCase
│   │   ├── create-portal.use-case.ts     # CreatePortalUseCase
│   │   ├── handle-webhook.use-case.ts    # HandleWebhookUseCase
│   │   ├── get-subscription.use-case.ts  # GetSubscriptionUseCase
│   │   ├── start-trial.use-case.ts       # StartTrialUseCase
│   │   └── delete-user-account.use-case.ts # DeleteUserAccountUseCase
│   └── dtos/
│       ├── checkout.dto.ts               # CheckoutSessionInput, CheckoutSessionResult
│       ├── portal.dto.ts                 # PortalSessionResult
│       ├── webhook.dto.ts                # WebhookEventInput
│       ├── subscription.dto.ts           # SubscriptionDto
│       └── trial.dto.ts                  # CreateTrialDto
├── infrastructure/
│   ├── adapters/
│   │   ├── stripe-payment-gateway.adapter.ts  # StripePaymentGatewayAdapter implements BillingPort
│   │   └── prisma-subscription.repository.ts  # PrismaSubscriptionRepository implements SubscriptionRepository
│   ├── controllers/
│   │   └── billing.controller.ts         # BillingController (HTTP layer)
│   ├── routes/
│   │   └── billing.routes.ts             # Fastify route registration + preParsing hook
│   └── schemas/
│       └── billing.schema.ts             # Zod schemas (moved from module root)
└── __tests__/
    ├── unit/
    │   ├── start-trial.use-case.spec.ts  # Migrated from billing.service.test.ts
    │   ├── create-checkout.use-case.spec.ts
    │   ├── handle-webhook.use-case.spec.ts
    │   └── subscription.repository.spec.ts
    └── integration/
        └── billing.routes.spec.ts         # Migrated from billing.routes.test.ts
```

---

## Port Interfaces

### BillingPort

```typescript
// domain/ports/billing.port.ts
import type { CheckoutSessionResult } from '../../application/dtos/checkout.dto.js'
import type { PortalSessionResult } from '../../application/dtos/portal.dto.js'

export interface CheckoutInput {
  userId: string
  userEmail?: string
  priceId: string
  stripeCustomerId?: string | null
}

export interface BillingPort {
  createCheckoutSession(input: CheckoutInput): Promise<CheckoutSessionResult>
  createPortalSession(customerId: string): Promise<PortalSessionResult>
  constructWebhookEvent(payload: Buffer, signature: string): import('stripe').Stripe.Event
}
```

**Design rationale:** `constructWebhookEvent` returns `Stripe.Event` (a Stripe SDK type). This is the ONLY Stripe type that crosses the port boundary. It's acceptable because the use case that handles webhooks needs the typed event — but the domain layer only sees a pass-through. The alternative would be to define a custom `WebhookEvent` DTO, which is overengineering for a refactor that preserves behavior.

### SubscriptionRepository

```typescript
// domain/ports/subscription.repository.ts
import type { Subscription } from '../entities/subscription.entity.js'

export interface CreateSubscriptionData {
  userId: string
  status: SubscriptionStatus
  interval: BillingInterval
  stripeCustomerId?: string | null
  stripeSubId?: string | null
  stripePriceId?: string | null
  currentPeriodEnd?: Date | null
  trialEnd?: Date | null
  cancelAtPeriodEnd?: boolean
}

export interface SubscriptionRepository {
  findByUserId(userId: string): Promise<Subscription | null>
  findByStripeSubId(stripeSubId: string): Promise<Subscription | null>
  upsertByUserId(userId: string, data: CreateSubscriptionData): Promise<Subscription>
  updateByStripeSubId(stripeSubId: string, data: Partial<CreateSubscriptionData>): Promise<void>
}
```

### UserAccountPort

```typescript
// domain/ports/user-account.port.ts

export interface UserAccountPort {
  deleteUserAccount(userId: string): Promise<void>
}
```

---

## Use Case Design

### CreateCheckoutUseCase

```typescript
// application/use-cases/create-checkout.use-case.ts
import type { BillingPort, CheckoutInput } from '../../domain/ports/billing.port.js'
import type { SubscriptionRepository } from '../../domain/ports/subscription.repository.js'
import type { CheckoutSessionResult } from '../dtos/checkout.dto.js'
import type { UseCase } from '@/shared/application/interfaces/use-case.interface.js'

export interface CreateCheckoutDto {
  userId: string
  userEmail?: string
  priceId: string
}

export class CreateCheckoutUseCase implements UseCase<CreateCheckoutDto, CheckoutSessionResult> {
  constructor(
    private readonly billingPort: BillingPort,
    private readonly subscriptionRepo: SubscriptionRepository,
  ) {}

  async execute(dto: CreateCheckoutDto): Promise<CheckoutSessionResult> {
    const existingSub = await this.subscriptionRepo.findByUserId(dto.userId)
    
    return this.billingPort.createCheckoutSession({
      userId: dto.userId,
      userEmail: dto.userEmail,
      priceId: dto.priceId,
      stripeCustomerId: existingSub?.stripeCustomerId,
    })
  }
}
```

### StartTrialUseCase

```typescript
// application/use-cases/start-trial.use-case.ts
import { TRIAL_DURATION_DAYS } from '@pakulab/shared'
import type { SubscriptionRepository } from '../../domain/ports/subscription.repository.js'
import type { Subscription } from '../../domain/entities/subscription.entity.js'
import type { UseCase } from '@/shared/application/interfaces/use-case.interface.js'
import { DuplicateSubscriptionException } from '../../domain/exceptions/duplicate-subscription.exception.js'

export type TrialPlan = 'TRIAL' | 'PRO_MONTHLY' | 'PRO_YEARLY'

export interface StartTrialDto {
  userId: string
  plan: TrialPlan
}

export class StartTrialUseCase implements UseCase<StartTrialDto, Subscription> {
  constructor(
    private readonly subscriptionRepo: SubscriptionRepository,
  ) {}

  async execute(dto: StartTrialDto): Promise<Subscription> {
    const existing = await this.subscriptionRepo.findByUserId(dto.userId)

    if (existing && (existing.status === 'ACTIVE' || existing.status === 'TRIALING')) {
      throw new DuplicateSubscriptionException()
    }

    const interval = dto.plan === 'PRO_YEARLY' ? 'YEARLY' : 'MONTHLY'
    const trialEnd = new Date(Date.now() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000)

    return this.subscriptionRepo.upsertByUserId(dto.userId, {
      userId: dto.userId,
      status: 'TRIALING',
      interval,
      trialEnd,
      currentPeriodEnd: trialEnd,
      stripeCustomerId: null,
      stripeSubId: null,
      stripePriceId: null,
      cancelAtPeriodEnd: false,
    })
  }
}
```

### HandleWebhookUseCase

```typescript
// application/use-cases/handle-webhook.use-case.ts
import type { BillingPort } from '../../domain/ports/billing.port.js'
import type { SubscriptionRepository } from '../../domain/ports/subscription.repository.js'
import type { Stripe } from 'stripe'

export interface RawWebhookInput {
  payload: Buffer
  signature: string
}

export class HandleWebhookUseCase {
  constructor(
    private readonly billingPort: BillingPort,
    private readonly subscriptionRepo: SubscriptionRepository,
  ) {}

  async execute(input: RawWebhookInput): Promise<void> {
    const event = this.billingPort.constructWebhookEvent(input.payload, input.signature)
    await this.routeEvent(event)
  }

  private async routeEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice)
        break
      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break
    }
  }

  // ... 5 handler methods (same logic as current handlers)
}
```

### DeleteUserAccountUseCase

```typescript
// application/use-cases/delete-user-account.use-case.ts
import type { UserAccountPort } from '../../domain/ports/user-account.port.js'
import type { UseCase } from '@/shared/application/interfaces/use-case.interface.js'

export class DeleteUserAccountUseCase implements UseCase<string, void> {
  constructor(
    private readonly userAccountPort: UserAccountPort,
  ) {}

  async execute(userId: string): Promise<void> {
    await this.userAccountPort.deleteUserAccount(userId)
  }
}
```

---

## Adapter Design

### StripePaymentGatewayAdapter

```typescript
// infrastructure/adapters/stripe-payment-gateway.adapter.ts
import Stripe from 'stripe'
import type { BillingPort, CheckoutInput } from '../../domain/ports/billing.port.js'
import type { CheckoutSessionResult } from '../../application/dtos/checkout.dto.js'
import type { PortalSessionResult } from '../../application/dtos/portal.dto.js'
import { AppError } from '@/shared/errors/index.js'

export class StripePaymentGatewayAdapter implements BillingPort {
  private readonly stripe: Stripe

  constructor(secretKey: string, webhookSecret: string) {
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2026-03-25.dahlia',
      typescript: true,
    })
    this.webhookSecret = webhookSecret
  }

  async createCheckoutSession(input: CheckoutInput): Promise<CheckoutSessionResult> {
    // ... same logic as current createCheckoutSession, but using this.stripe
  }

  async createPortalSession(customerId: string): Promise<PortalSessionResult> {
    // ... same logic as current createPortalSession
  }

  constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
    // ... same logic as current constructWebhookEvent
  }
}
```

### PrismaSubscriptionRepository

```typescript
// infrastructure/adapters/prisma-subscription.repository.ts
import type { PrismaClient, SubscriptionStatus, BillingInterval } from '@prisma/client'
import type { SubscriptionRepository, CreateSubscriptionData } from '../../domain/ports/subscription.repository.js'
import type { Subscription } from '../../domain/entities/subscription.entity.js'

export class PrismaSubscriptionRepository implements SubscriptionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByUserId(userId: string): Promise<Subscription | null> {
    const row = await this.prisma.subscription.findUnique({
      where: { userId },
      select: { /* all fields */ },
    })
    return row ? this.toDomain(row) : null
  }

  async upsertByUserId(userId: string, data: CreateSubscriptionData): Promise<Subscription> {
    const row = await this.prisma.subscription.upsert({
      where: { userId },
      create: { /* ... */ },
      update: { /* ... */ },
    })
    return this.toDomain(row)
  }

  // ... other methods

  private toDomain(row: /* Prisma Subscription type */): Subscription {
    return {
      id: row.id,
      userId: row.userId,
      status: row.status,
      interval: row.interval,
      stripeCustomerId: row.stripeCustomerId,
      stripeSubId: row.stripeSubId,
      stripePriceId: row.stripePriceId,
      currentPeriodEnd: row.currentPeriodEnd,
      trialEnd: row.trialEnd,
      cancelAtPeriodEnd: row.cancelAtPeriodEnd,
      canceledAt: row.canceledAt,
      createdAt: row.createdAt,
    }
  }
}
```

---

## Dependency Injection — Container

```typescript
// shared/infrastructure/di/container.ts (NEW — add billing wiring)

import { StripePaymentGatewayAdapter } from '@/modules/billing/infrastructure/adapters/stripe-payment-gateway.adapter.js'
import { PrismaSubscriptionRepository } from '@/modules/billing/infrastructure/adapters/prisma-subscription.repository.js'
import { CreateCheckoutUseCase } from '@/modules/billing/application/use-cases/create-checkout.use-case.js'
import { CreatePortalUseCase } from '@/modules/billing/application/use-cases/create-portal.use-case.js'
import { HandleWebhookUseCase } from '@/modules/billing/application/use-cases/handle-webhook.use-case.js'
import { GetSubscriptionUseCase } from '@/modules/billing/application/use-cases/get-subscription.use-case.js'
import { StartTrialUseCase } from '@/modules/billing/application/use-cases/start-trial.use-case.js'
import { DeleteUserAccountUseCase } from '@/modules/billing/application/use-cases/delete-user-account.use-case.js'
import { BillingController } from '@/modules/billing/infrastructure/controllers/billing.controller.js'

// Adapters (infrastructure)
const stripeAdapter = new StripePaymentGatewayAdapter(
  env.STRIPE_SECRET_KEY,
  env.STRIPE_WEBHOOK_SECRET,
)
const subscriptionRepo = new PrismaSubscriptionRepository(prisma)
const userAccountAdapter = new PrismaUserAccountAdapter(prisma)

// Use Cases (application)
const createCheckoutUseCase = new CreateCheckoutUseCase(stripeAdapter, subscriptionRepo)
const createPortalUseCase = new CreatePortalUseCase(stripeAdapter, subscriptionRepo)
const handleWebhookUseCase = new HandleWebhookUseCase(stripeAdapter, subscriptionRepo)
const getSubscriptionUseCase = new GetSubscriptionUseCase(subscriptionRepo)
const startTrialUseCase = new StartTrialUseCase(subscriptionRepo)
const deleteUserAccountUseCase = new DeleteUserAccountUseCase(userAccountAdapter)

// Controller (infrastructure)
export const billingController = new BillingController(
  createCheckoutUseCase,
  createPortalUseCase,
  handleWebhookUseCase,
  getSubscriptionUseCase,
  startTrialUseCase,
  deleteUserAccountUseCase,
)

// Backward-compat exports (used by auth.config.ts and profiles.routes.ts)
export { startTrialUseCase as createTrialSubscription }
export { deleteUserAccountUseCase as deleteUserAccount }
```

---

## Sequence Diagrams

### Checkout Flow (no change in behavior)

```
User Agent          BillingController    CreateCheckoutUseCase   SubscriptionRepo   StripeAdapter
  |                       |                      |                      |                |
  | POST /create-checkout |                      |                      |                |
  |---------------------->|                      |                      |                |
  |                       | execute(dto)         |                      |                |
  |                       |--------------------->|                      |                |
  |                       |                      | findByUserId(userId)  |                |
  |                       |                      |--------------------->|                |
  |                       |                      | Subscription | null   |                |
  |                       |                      |<---------------------|                |
  |                       |                      | createCheckoutSession(input)          |
  |                       |                      |-------------------------------------->|
  |                       |                      | { url, sessionId }                   |
  |                       |                      |<--------------------------------------|
  |                       | { url, sessionId }   |                      |                |
  |                       |<---------------------|                      |                |
  | { data: { url, ... }} |                      |                      |                |
  |<----------------------|                      |                      |                |
```

### Webhook Flow (no change in behavior)

```
Stripe               BillingController   HandleWebhookUseCase   StripeAdapter    SubscriptionRepo
  |                       |                      |                    |                |
  | POST /webhook         |                      |                    |                |
  | (raw body + sig)      |                      |                    |                |
  |---------------------->|                      |                    |                |
  |                       | execute({payload,sig})|                   |                |
  |                       |--------------------->|                    |                |
  |                       |                      | constructWebhook() |                |
  |                       |                      |------------------->|                |
  |                       |                      | Stripe.Event       |                |
  |                       |                      |<-------------------|                |
  |                       |                      |                    |                |
  |                       |                      | routeEvent(event)  |                |
  |                       |                      |──┐                 |                |
  |                       |                      |  | switch type      |                |
  |                       |                      |<─┘                 |                |
  |                       |                      |                    |                |
  |                       |                      | upsertByUserId()   |                |
  |                       |                      |---------------------------------->|
  |                       |                      | Subscription       |                |
  |                       |                      |<----------------------------------|
  |                       | void                 |                    |                |
  |                       |<---------------------|                    |                |
  | { received: true }    |                      |                    |                |
  |<----------------------|                      |                    |                |
```

---

## Migration Strategy

### Phase 1: Create new files (no deletions)

1. Create `domain/` with entities, ports, value objects, exceptions
2. Create `application/` with use cases and DTOs
3. Create `infrastructure/adapters/` with Stripe and Prisma adapters
4. Create `infrastructure/controllers/billing.controller.ts`
5. Move `billing.schema.ts` to `infrastructure/schemas/`
6. Update `billing.routes.ts` to use controller instead of direct service calls
7. Create `index.ts` barrel with backward-compat exports

**At this point:** Old `billing.service.ts` still exists. New hexagonal structure lives alongside. No consumers broken.

### Phase 2: Switch consumers

8. Update `auth.config.ts`: change import from `'../billing/billing.service.js'` to barrel `'../billing/index.js'` (or directly to use case)
9. Update `profiles.routes.ts`: change import from `'../billing/billing.service.js'` to `deleteUserAccount` from barrel
10. Update `app.ts`: point to new `billing.routes.ts` path

### Phase 3: Migrate tests

11. Adapt `billing.service.test.ts` → `__tests__/unit/start-trial.use-case.spec.ts`
12. Adapt `billing.routes.test.ts` → `__tests__/integration/billing.routes.spec.ts`

### Phase 4: Cleanup

13. Delete old `billing.service.ts`
14. Remove barrel exports that are no longer needed
15. Run full test suite, fix any regressions
