# Tasks: Billing Module — Hexagonal Refactor

> Status: draft
> Change: billing-hexagonal-refactor

## Task Groups

| Phase | Group | Description | Tasks |
|-------|-------|-------------|-------|
| 1 | Infrastructure | Create domain layer (ports, entities, value objects, exceptions) | 1.1–1.5 |
| 2 | Implementation | Create application layer (use cases, DTOs) | 2.1–2.7 |
| 3 | Implementation | Create infrastructure layer (adapters, controller, routes) | 3.1–3.6 |
| 4 | Implementation | DI container + barrel exports + consumer updates | 4.1–4.5 |
| 5 | Testing | Migrate existing tests to new structure | 5.1–5.3 |
| 6 | Verification | Type check, lint, full test suite, clean old code | 6.1–6.4 |

---

## Phase 1: Domain Layer

### 1.1 Create Subscription domain entity

**File:** `apps/api/src/modules/billing/domain/entities/subscription.entity.ts`

- Define `Subscription` interface with all fields from the Prisma model
- Fields: `id`, `userId`, `status`, `interval`, `stripeCustomerId`, `stripeSubId`, `stripePriceId`, `currentPeriodEnd`, `trialEnd`, `cancelAtPeriodEnd`, `canceledAt`, `createdAt`
- Export as type, NOT class (follows shared package conventions)

### 1.2 Create SubscriptionStatus value object

**File:** `apps/api/src/modules/billing/domain/value-objects/subscription-status.vo.ts`

- Define `SubscriptionStatus` type: `'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED'`
- Define `BillingInterval` type: `'MONTHLY' | 'YEARLY'`
- Export helper `isActive(status: SubscriptionStatus): boolean` — true for ACTIVE or TRIALING

### 1.3 Create BillingPort interface

**File:** `apps/api/src/modules/billing/domain/ports/billing.port.ts`

- Define `CheckoutInput` interface: `{ userId, userEmail?, priceId, stripeCustomerId? }`
- Define `BillingPort` interface with:
  - `createCheckoutSession(input: CheckoutInput): Promise<CheckoutSessionResult>`
  - `createPortalSession(customerId: string): Promise<PortalSessionResult>`
  - `constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event`
- Import `CheckoutSessionResult` and `PortalSessionResult` from application DTOs
- Use `import('stripe').Stripe.Event` type reference (not hard import)

### 1.4 Create SubscriptionRepository port

**File:** `apps/api/src/modules/billing/domain/ports/subscription.repository.ts`

- Define `CreateSubscriptionData` interface with all writable Subscription fields
- Define `SubscriptionRepository` interface with:
  - `findByUserId(userId: string): Promise<Subscription | null>`
  - `findByStripeSubId(stripeSubId: string): Promise<Subscription | null>`
  - `upsertByUserId(userId: string, data: CreateSubscriptionData): Promise<Subscription>`
  - `updateByStripeSubId(stripeSubId: string, data: Partial<CreateSubscriptionData>): Promise<void>`
- Import `Subscription` from domain entity

### 1.5 Create domain exceptions

**Files:**
- `apps/api/src/modules/billing/domain/exceptions/duplicate-subscription.exception.ts`
- `apps/api/src/modules/billing/domain/exceptions/missing-stripe-customer.exception.ts`

- `DuplicateSubscriptionException` extends `DomainException`
  - `code = 'DUPLICATE_SUBSCRIPTION'`, `httpStatus = 409`
  - Message: "Ya tienes una suscripción activa"
- `MissingStripeCustomerException` extends `DomainException`
  - `code = 'MISSING_STRIPE_CUSTOMER'`, `httpStatus = 404`
  - Message: "Suscripción de Stripe no encontrada"

---

## Phase 2: Application Layer

### 2.1 Create DTOs

**Files:**
- `apps/api/src/modules/billing/application/dtos/checkout.dto.ts`
- `apps/api/src/modules/billing/application/dtos/portal.dto.ts`
- `apps/api/src/modules/billing/application/dtos/subscription.dto.ts`
- `apps/api/src/modules/billing/application/dtos/trial.dto.ts`

Content:
- `checkout.dto.ts`: `CreateCheckoutDto { userId, userEmail?, priceId }`, `CheckoutSessionResult { url, sessionId }`
- `portal.dto.ts`: `PortalSessionResult { url }`
- `subscription.dto.ts`: `SubscriptionDto` — flat object matching current API response shape (all fields from Subscription entity, dates as ISO strings)
- `trial.dto.ts`: `StartTrialDto { userId, plan: TrialPlan }`, `TrialPlan = 'TRIAL' | 'PRO_MONTHLY' | 'PRO_YEARLY'`

### 2.2 Create StartTrialUseCase

**File:** `apps/api/src/modules/billing/application/use-cases/start-trial.use-case.ts`

- Move logic from `billing.service.ts` lines 149-206
- Constructor accepts `SubscriptionRepository`
- `execute(dto: StartTrialDto): Promise<Subscription>`
- Check existing subscription status, throw `DuplicateSubscriptionException` if ACTIVE/TRIALING
- Calculate `trialEnd = now + TRIAL_DURATION_DAYS`, `currentPeriodEnd = trialEnd`
- Map plan to interval: `PRO_YEARLY → YEARLY`, else `MONTHLY`
- Call `subscriptionRepo.upsertByUserId()`, return result
- Import `TRIAL_DURATION_DAYS` from `@pakulab/shared`

### 2.3 Create GetSubscriptionUseCase

**File:** `apps/api/src/modules/billing/application/use-cases/get-subscription.use-case.ts`

- Move logic from `billing.service.ts` lines 131-143
- Constructor accepts `SubscriptionRepository`
- `execute(userId: string): Promise<SubscriptionDto | null>`
- Call `subscriptionRepo.findByUserId(userId)`
- Map domain entity to DTO (dates to ISO strings)

### 2.4 Create CreateCheckoutUseCase

**File:** `apps/api/src/modules/billing/application/use-cases/create-checkout.use-case.ts`

- Move logic from `billing.service.ts` lines 48-109
- Constructor accepts `BillingPort` + `SubscriptionRepository`
- `execute(dto: CreateCheckoutDto): Promise<CheckoutSessionResult>`
- Look up existing subscription for `stripeCustomerId` via `subscriptionRepo`
- Build `CheckoutInput` and call `billingPort.createCheckoutSession()`
- Environment variable resolution (`STRIPE_SUCCESS_URL`, `STRIPE_CANCEL_URL`) stays in use case (application concern, not infrastructure)

### 2.5 Create CreatePortalUseCase

**File:** `apps/api/src/modules/billing/application/use-cases/create-portal.use-case.ts`

- Move logic from `billing.service.ts` lines 112-125
- Constructor accepts `BillingPort` + `SubscriptionRepository`
- `execute(userId: string): Promise<PortalSessionResult>`
- Look up subscription for `stripeCustomerId`
- Throw `MissingStripeCustomerException` if not found
- Call `billingPort.createPortalSession(customerId)`
- Environment variable resolution stays in use case

### 2.6 Create HandleWebhookUseCase

**File:** `apps/api/src/modules/billing/application/use-cases/handle-webhook.use-case.ts`

- Move logic from `billing.service.ts` lines 208-359
- Constructor accepts `BillingPort` + `SubscriptionRepository`
- `execute(input: { payload: Buffer, signature: string }): Promise<void>`
- Call `billingPort.constructWebhookEvent()` to verify signature
- Route event type to internal handlers:
  - `handleCheckoutCompleted` — call Stripe API for full subscription, upsert DB
  - `handleSubscriptionUpdated` — update DB status/interval/periods
  - `handleSubscriptionDeleted` — set CANCELED
  - `handleInvoicePaid` — set ACTIVE
  - `handleInvoicePaymentFailed` — set PAST_DUE
- Keep `mapStripeStatus()` and `resolveInterval()` as private helpers

### 2.7 Create DeleteUserAccountUseCase

**File:** `apps/api/src/modules/billing/application/use-cases/delete-user-account.use-case.ts`

- Move logic from `billing.service.ts` lines 363-460
- But NOT as an adapter — it's an application orchestration
- Constructor accepts `PrismaClient` directly (temporary — this use case is cross-cutting)
- **DESIGN NOTE:** This use case takes PrismaClient directly instead of a port because the account deletion touches 10+ tables and we don't want to create 10 repository ports for a single operation. This is an acceptable tradeoff for a GDPR wipe operation that is inherently infrastructure-coupled. We will create a `PrismaUserAccountAdapter` in infrastructure that implements `UserAccountPort`, and the use case will accept `UserAccountPort`.
- `execute(userId: string): Promise<void>`
- Same `$transaction` logic as current code

---

## Phase 3: Infrastructure Layer

### 3.1 Create StripePaymentGatewayAdapter

**File:** `apps/api/src/modules/billing/infrastructure/adapters/stripe-payment-gateway.adapter.ts`

- Move Stripe SDK initialization and API calls from `billing.service.ts`
- `implements BillingPort`
- Constructor takes `secretKey: string, webhookSecret: string`
- Initialize `Stripe` client in constructor (not lazy singleton)
- Implement `createCheckoutSession`, `createPortalSession`, `constructWebhookEvent`
- Keep all Stripe v21 API details (subscription mode, MXN currency, promotion codes, `customer_email`/`customer`, metadata, `STRIPE_SUCCESS_URL`/`STRIPE_CANCEL_URL` from env)
- SDK v21 field access: `subscription.items.data[0]`, `invoice.parent?.subscription_details`

### 3.2 Create PrismaSubscriptionRepository

**File:** `apps/api/src/modules/billing/infrastructure/adapters/prisma-subscription.repository.ts`

- `implements SubscriptionRepository`
- Constructor takes `PrismaClient`
- Implement all 4 repository methods
- `toDomain()` mapper: convert Prisma row to `Subscription` domain entity
- `upsertByUserId`: create/update pattern from current `billing.service.ts` lines 186-205 (adapted)

### 3.3 Create PrismaUserAccountAdapter

**File:** `apps/api/src/modules/billing/infrastructure/adapters/prisma-user-account.adapter.ts`

- `implements UserAccountPort`
- Constructor takes `PrismaClient`
- `deleteUserAccount(userId: string): Promise<void>` — the full `$transaction` wipe logic from current `billing.service.ts` lines 363-460
- All 10+ deleteMany operations in correct FK order

### 3.4 Move billing.schema.ts to infrastructure/schemas/

**Action:** Move `apps/api/src/modules/billing/billing.schema.ts` → `apps/api/src/modules/billing/infrastructure/schemas/billing.schema.ts`

- No content changes, only path change
- Update imports in routes file

### 3.5 Create BillingController

**File:** `apps/api/src/modules/billing/infrastructure/controllers/billing.controller.ts`

- Accepts all 6 use cases via constructor
- Methods mapean 1:1 con los endpoints actuales:
  - `createCheckout(req, reply)` → calls `createCheckoutUseCase.execute()`
  - `createPortal(req, reply)` → calls `createPortalUseCase.execute()`
  - `handleWebhook(req, reply)` → extracts rawBody + signature, calls `handleWebhookUseCase.execute()`
  - `getSubscription(req, reply)` → calls `getSubscriptionUseCase.execute()`
  - `startTrial(req, reply)` → calls `startTrialUseCase.execute()`
  - `deleteAccount(req, reply)` → calls `deleteUserAccountUseCase.execute()`
- Response format: all responses wrapped in `{ data: ... }` (current contract)
- Error handling: re-throws domain exceptions (caught by Fastify error handler)

### 3.6 Update billing.routes.ts

**File:** `apps/api/src/modules/billing/infrastructure/routes/billing.routes.ts`

- Keep the scoped `preParsing` hook (same logic)
- Replace direct service function calls with `billingController` method calls
- Same route definitions, same auth preHandlers, same HTTP methods and paths
- Inject `BillingController` via Fastify plugin options or shared state
- Export `billingRoutes` plugin as before

---

## Phase 4: Wiring

### 4.1 Create DI container wiring for billing

**File:** `apps/api/src/shared/infrastructure/di/billing.container.ts` (new)

- Instantiate adapters: `StripePaymentGatewayAdapter`, `PrismaSubscriptionRepository`, `PrismaUserAccountAdapter`
- Instantiate use cases with adapter injection
- Instantiate `BillingController` with use case injection
- Export `billingController` singleton
- Backward compat aliases: `export const createTrialSubscription = startTrialUseCase.execute.bind(startTrialUseCase)`

**Or add to existing container if one exists.** Currently `shared/infrastructure/di/` doesn't exist — create it.

### 4.2 Update app.ts to use new billing routes

**File:** `apps/api/src/app.ts`

- Change import from `'./modules/billing/billing.routes.js'` to `'./modules/billing/infrastructure/routes/billing.routes.js'`
- Pass `billingController` to the plugin if needed (or use shared state / Fastify decorate)

### 4.3 Update auth.config.ts import

**File:** `apps/api/src/modules/auth/auth.config.ts`

- Change line 14: `import { createTrialSubscription } from '../billing/billing.service.js'`
- To: `import { createTrialSubscription } from '../billing/index.js'`
- The barrel exports the use case with the original function name
- No logic change — only import path

### 4.4 Update profiles.routes.ts import

**File:** `apps/api/src/modules/profiles/profiles.routes.ts`

- Change line 20: `import { deleteUserAccount } from '../billing/billing.service.js'`
- To: `import { deleteUserAccount } from '../billing/index.js'`
- No logic change — only import path

### 4.5 Create barrel index.ts

**File:** `apps/api/src/modules/billing/index.ts`

- Re-export `createTrialSubscription` and `deleteUserAccount` from DI container
- This is the backward-compat surface until consumers are fully migrated

---

## Phase 5: Test Migration

### 5.1 Migrate service tests → use case tests

**File:** `apps/api/src/modules/billing/__tests__/unit/start-trial.use-case.spec.ts`

- Content from `billing.service.test.ts`
- Adapt mocks:
  - Mock `SubscriptionRepository` interface instead of raw Prisma client
  - Use `vi.fn()` for repository methods (`findByUserId`, `upsertByUserId`)
- Instantiate `StartTrialUseCase` with mocked repo
- All 15 test cases preserved with same assertions
- Remove dynamic `await import()` — use direct TypeScript import

### 5.2 Migrate route tests → integration tests

**File:** `apps/api/src/modules/billing/__tests__/integration/billing.routes.spec.ts`

- Content from `billing.routes.test.ts`
- Replace source-code-reading tests with actual Fastify instance tests
- Build minimal Fastify app with billing routes, mocked use cases
- Test: HTTP status codes, response shapes, validation
- All 10 test cases adapted

### 5.3 Create use case test for HandleWebhookUseCase

**File:** `apps/api/src/modules/billing/__tests__/unit/handle-webhook.use-case.spec.ts`

- NEW tests (was out of scope in proposal, but minimal unit tests for `routeEvent`)
- Mock `BillingPort` and `SubscriptionRepository`
- Test event routing: correct handler called for each of 5 event types
- Test that `constructWebhookEvent` is called with correct args

---

## Phase 6: Verification & Cleanup

### 6.1 Run type check

```bash
pnpm typecheck
```

- All packages must compile with zero errors
- Particularly verify: no `any` types in billing module

### 6.2 Run lint

```bash
pnpm lint
```

- Zero lint errors in billing module

### 6.3 Run full test suite

```bash
pnpm --filter api test
```

- All 25 billing tests pass
- No regressions in auth, profiles, dashboard, or other modules
- Target: 379 tests passing (current count minus 5 menu failures = 374 + 25 billing)

### 6.4 Delete old billing.service.ts

**File:** `apps/api/src/modules/billing/billing.service.ts` → DELETE

- Only after all tests pass and typecheck succeeds
- Verify no remaining imports of this file:
  ```bash
  grep -r "billing.service" apps/api/src/ --include="*.ts"
  ```
  Should return empty

---

## Task Dependency Graph

```
Phase 1 (Domain)
  1.1 Subscription entity
  1.2 SubscriptionStatus VO
  1.3 BillingPort ───── depends on 1.1
  1.4 SubscriptionRepo ─ depends on 1.1
  1.5 Domain exceptions

Phase 2 (Application)
  2.1 DTOs ───────────── depends on 1.1, 1.2
  2.2 StartTrialUC ───── depends on 1.4, 1.5, 2.1
  2.3 GetSubscriptionUC ─ depends on 1.4, 2.1
  2.4 CreateCheckoutUC ── depends on 1.3, 1.4, 2.1
  2.5 CreatePortalUC ──── depends on 1.3, 1.4, 1.5, 2.1
  2.6 HandleWebhookUC ─── depends on 1.3, 1.4
  2.7 DeleteAccountUC ─── depends on UserAccountPort (to be created in 3.3)

Phase 3 (Infrastructure)
  3.1 StripeAdapter ───── depends on 1.3, 2.1
  3.2 PrismaSubRepo ────── depends on 1.4, 1.1
  3.3 PrismaUserAdapter ─ depends on UserAccountPort
  3.4 Move schemas
  3.5 BillingController ── depends on 2.2-2.7, 3.4
  3.6 Update routes ────── depends on 3.5

Phase 4 (Wiring)
  4.1 DI container ─────── depends on 3.1, 3.2, 3.3, 3.5
  4.2 Update app.ts ────── depends on 3.6
  4.3 Update auth.config ─ depends on 4.1
  4.4 Update profiles ──── depends on 4.1
  4.5 Barrel index ─────── depends on 4.1

Phase 5 (Tests)
  5.1 Use case tests ───── depends on 2.2
  5.2 Route tests ──────── depends on 3.6
  5.3 Webhook tests ────── depends on 2.6

Phase 6 (Verify)
  6.1-6.4 ─────────────── depends on ALL above
```

---

## Estimated Effort

| Phase | Tasks | Est. Lines Changed | Est. Time |
|-------|-------|-------------------|-----------|
| 1: Domain | 5 | ~80 new | 30 min |
| 2: Application | 7 | ~400 new, ~100 moved | 60 min |
| 3: Infrastructure | 6 | ~350 new, ~200 moved | 45 min |
| 4: Wiring | 5 | ~80 changed | 20 min |
| 5: Tests | 3 | ~100 adapted | 30 min |
| 6: Verify | 4 | ~10 changed, ~460 deleted | 20 min |
| **Total** | **30** | **~400 net new, ~460 deleted** | **~3.5h** |

**Review budget:** ~400 lines net new (within 400-line budget). Old file deletion adds ~-460 lines. Total diff ~860 lines touched — borderline but mostly deletions.
