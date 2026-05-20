# Billing Module — Deep Coupling Analysis

> Generated: 2026-05-17
> Purpose: Map ALL imports, dependencies, and coupling points to safely refactor billing to hexagonal architecture.

---

## 1. Upstream Consumers (Who Depends on Billing)

### 1.1 Auth Auto-Provision (CRITICAL)

**File:** `apps/api/src/modules/auth/auth.config.ts` (line 14)

```typescript
import { createTrialSubscription } from '../billing/billing.service.js'
```

**Usage** (lines 167-177): Inside BetterAuth's `databaseHooks.user.create.after` hook. Called for every new user (email or Google OAuth).

```typescript
after: async (user, _ctx) => {
  try {
    await createTrialSubscription(prisma, {
      userId: user.id,
      plan: 'TRIAL',
    })
  } catch (err) {
    console.error('[auth] Failed to provision trial for user', user.id, err)
  }
},
```

**Risk:** Breaking `createTrialSubscription` → all new signups blocked or left without trial. The catch-all swallows errors at runtime, but a compile-time or import-time break would fail the entire auth config module.

**Test coupling:** `auth.routes.test.ts` references `subscriptionStatus` and `trialEnd` in user response shape assertions (lines 277-278, 327-328). These are type assertions against the session-info endpoint, not direct billing imports. No direct mock of billing service in auth tests.

---

### 1.2 Profile Module — Account Deletion (CRITICAL)

**File:** `apps/api/src/modules/profiles/profiles.routes.ts` (line 20)

```typescript
import { deleteUserAccount } from '../billing/billing.service.js'
```

**Usage** (line 170): `DELETE /api/profiles/me` route. Deletes ALL user data via Prisma transaction.

```typescript
await deleteUserAccount(fastify.prisma, userId)
```

**Why it's in billing module:** The `deleteUserAccount` function lives in `billing.service.ts` because it deletes the subscription among other user data. This is a cross-cutting concern that should be extracted to a dedicated `user-account` use case.

**Test coupling:** Profile tests (`profiles` directory) have ZERO direct imports from billing module. The `DELETE /me` endpoint doesn't have dedicated profile tests yet.

**Risk:** Moving `deleteUserAccount` requires profile route import path change + the function must remain accessible.

---

### 1.3 Frontend — Store Consumers (6 files)

All Vue components import `useBillingStore` from `@/shared/stores/billingStore.js`:

| File | Usage |
|------|-------|
| `shared/layouts/AppLayout.vue` (line 183) | Fetches subscription on mount, shows PAST_DUE badges, tier-based UI |
| `shared/components/TrialBanner.vue` (line 13) | Reads `billingStore.subscription` to display trial days remaining |
| `modules/billing/PlanSelectionPage.vue` (line 49) | Reads loading/error/subscription states |
| `modules/billing/CheckoutSuccessPage.vue` (line 52) | Calls `fetchSubscription()` on mount |
| `modules/billing/PricingPage.vue` (line 143) | Calls `createCheckout()`, `openPortal()`, reads subscription state |
| `modules/billing/PaywallPage.vue` (line 104) | Calls `createCheckout()`, `deleteAccount()`, reads subscription state |

**Dynamic Import (Circular Dependency Workaround):**

**File:** `apps/web/src/shared/stores/authStore.ts` (lines 187-193)

```typescript
// Import billingStore lazily to avoid circular dependency
const { useBillingStore } = await import('@/shared/stores/billingStore.js')
const billingStore = useBillingStore()
try {
  await billingStore.startTrial('TRIAL')
  await checkSession()
} catch { /* log error */ }
```

This is called after email signup in `signUp()`. The OAuth design (AD5) already moved trial provisioning server-side, but this frontend call remains as "safety net" (idempotent thanks to ConflictError check in `createTrialSubscription`).

**Risk:** The billingStore defines its own `Subscription` interface and `SubscriptionStatus` type (lines 16-35) that MUST match the API contract. If we change response shapes, the store's TypeScript types will silently mismatch.

---

### 1.4 App Route Registration (Indirect)

**File:** `apps/api/src/app.ts` (line 29)

```typescript
import { billingRoutes } from './modules/billing/billing.routes.js'
```

Registered at prefix `/api/billing`. Standard Fastify plugin registration. No dependency other than the routes plugin itself.

---

## 2. Downstream Dependencies (What Billing Depends On)

### 2.1 External Libraries

| Import | Source | Used By |
|--------|--------|---------|
| `Stripe` | `stripe` (v21, API 2026-03-25.dahlia) | `billing.service.ts` |
| `Readable` | `node:stream` | `billing.routes.ts` (webhook raw body capture) |
| `FastifyPluginAsync`, `FastifyReply`, `FastifyRequest` | `fastify` | routes |
| `z` | `zod` | `billing.schema.ts` |
| `PrismaClient` | `@prisma/client` | `billing.service.ts` |

### 2.2 Internal Shared (API layer)

| Import | Source File | Used In |
|--------|-------------|---------|
| `requireAuth` | `../../shared/hooks/requireAuth.js` | billing.routes.ts |
| `requireTier` | `../../shared/hooks/requireTier.js` | billing.routes.ts |
| `AppError` | `../../shared/errors/index.js` | billing.service.ts, billing.routes.ts |
| `NotFoundError` | `../../shared/errors/index.js` | billing.service.ts, billing.routes.ts |
| `ConflictError` | `../../shared/errors/index.js` | billing.service.ts |

### 2.3 Shared Package (`@pakulab/shared`)

| Import | Source File | Used In |
|--------|-------------|---------|
| `TRIAL_DURATION_DAYS` | `constants/tiers.ts` | billing.service.ts |
| `SubscriptionStatus` (type) | `types/user.ts` | auth.ts plugin (not billing directly) |
| `UserTier` (type) | `types/user.ts` | auth.ts plugin, requireTier.ts (not billing directly) |

**Key insight:** The billing module itself only imports `TRIAL_DURATION_DAYS` from `@pakulab/shared`. It does NOT import `SubscriptionStatus` or `UserTier` from shared — those are used by the auth plugin and tier hooks which sit *outside* billing.

### 2.4 Internal Module

| Import | Source |
|--------|--------|
| `createCheckoutSchema`, `startTrialSchema` | `./billing.schema.js` (same module) |
| All 6 exported functions | `./billing.service.js` (same module) |

---

## 3. API Contract (All Routes + Response Shapes)

Base prefix: `/api/billing`

### 3.1 `POST /api/billing/create-checkout`
- **Auth:** `requireAuth` + `requireTier('FREE')`
- **Body:** `{ priceId: string }` (validated via `createCheckoutSchema`)
- **Calls:** `createCheckoutSession(prisma, { userId, userEmail, priceId })`
- **Response:** `{ data: { url: string, sessionId: string } }`

### 3.2 `POST /api/billing/create-portal`
- **Auth:** `requireAuth` only (no tier guard — route validates stripeCustomerId)
- **Body:** none
- **Calls:** `createPortalSession(stripeCustomerId)` — after DB lookup
- **Response:** `{ data: { url: string } }`

### 3.3 `POST /api/billing/webhook`
- **Auth:** NONE (`{}` preHandler)
- **Body:** Raw Buffer (captured by scoped `preParsing` hook)
- **Headers:** `stripe-signature` required
- **Calls:** `constructWebhookEvent(rawBody, signature)` → `handleWebhookEvent(prisma, event)`
- **Response:** `{ received: true }`

### 3.4 `GET /api/billing/subscription`
- **Auth:** `requireAuth`
- **Calls:** `getUserSubscription(prisma, userId)`
- **Response:** `{ data: Subscription | null }`
- **Subscription shape:**
  ```typescript
  {
    id: string
    status: 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED'
    interval: 'MONTHLY' | 'YEARLY'
    stripePriceId: string | null
    stripeCustomerId: string | null
    currentPeriodEnd: string | null   // DateTime
    trialEnd: string | null
    cancelAtPeriodEnd: boolean
    canceledAt: string | null
    createdAt: string
  }
  ```

### 3.5 `POST /api/billing/start-trial`
- **Auth:** `requireAuth`
- **Body:** `{ plan: 'TRIAL' | 'PRO_MONTHLY' | 'PRO_YEARLY' }` (validated via `startTrialSchema`)
- **Calls:** `createTrialSubscription(prisma, { userId, plan })`
- **Response:** `{ data: Subscription }` (full Subscription object, 201 Created)

---

## 4. Database Contract (Subscription Model + Relations)

### 4.1 Prisma Model

```prisma
model Subscription {
  id               String             @id @default(cuid())
  userId           String             @unique
  stripeCustomerId String?            @unique
  stripeSubId      String?            @unique
  stripePriceId    String?
  status           SubscriptionStatus @default(TRIALING)
  interval         BillingInterval    @default(MONTHLY)
  currentPeriodEnd DateTime?
  trialEnd         DateTime?
  cancelAtPeriodEnd Boolean           @default(false)
  canceledAt       DateTime?
  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([stripeSubId])
}
```

### 4.2 Relations

- **User** (`@relation(onDelete: Cascade)`): One-to-one via `userId` (unique). Deleting a User cascades to delete Subscription.
- **No other models reference Subscription directly.** Subscription is a leaf entity.

### 4.3 Enum Values

```
SubscriptionStatus: ACTIVE | TRIALING | PAST_DUE | CANCELED | EXPIRED
BillingInterval:    MONTHLY | YEARLY
```

### 4.4 Auth Plugin Query (not in billing module, but reads Subscription)

**File:** `apps/api/src/shared/plugins/auth.ts` (lines 48-50)

```typescript
const userData = await fastify.prisma.user.findUnique({
  where: { id: session.user.id },
  select: {
    subscription: {
      select: { status: true, currentPeriodEnd: true, trialEnd: true },
    },
    ...
  },
})
```

The auth plugin resolves `request.user.tier` and `request.user.subscriptionStatus` from the Subscription row. This is a *read-only* coupling. Billing writes → auth reads via DB.

---

## 5. Type Contract

### 5.1 Types Exported by Billing Module

| Export | File | Type/Interface |
|--------|------|----------------|
| `billingRoutes` | `billing.routes.ts` | FastifyPluginAsync |
| `createCheckoutSession` | `billing.service.ts` | async function |
| `createPortalSession` | `billing.service.ts` | async function |
| `constructWebhookEvent` | `billing.service.ts` | function |
| `handleWebhookEvent` | `billing.service.ts` | async function |
| `getUserSubscription` | `billing.service.ts` | async function |
| `createTrialSubscription` | `billing.service.ts` | async function |
| `deleteUserAccount` | `billing.service.ts` | async function |
| `CheckoutSessionResult` | `billing.service.ts` | interface |
| `PortalSessionResult` | `billing.service.ts` | interface |
| `TrialPlan` | `billing.service.ts` | type (`'TRIAL' \| 'PRO_MONTHLY' \| 'PRO_YEARLY'`) |
| `CreateTrialSubscriptionInput` | `billing.service.ts` | interface |
| `createCheckoutSchema` | `billing.schema.ts` | ZodObject |
| `startTrialSchema` | `billing.schema.ts` | ZodObject |
| `CreateCheckoutInput` | `billing.schema.ts` | type |
| `StartTrialInput` | `billing.schema.ts` | type |

### 5.2 Types Imported by Consumers

| Consumer | Type Imported |
|----------|--------------|
| `auth.config.ts` | `createTrialSubscription` (function) |
| `profiles.routes.ts` | `deleteUserAccount` (function) |
| `billingStore.ts` (frontend) | Defines its OWN `Subscription` and `SubscriptionStatus` — NOT imported from server |

### 5.3 Types from `@pakulab/shared`

| Type | Defined In | Used By |
|------|-----------|---------|
| `UserTier` | `types/user.ts` | `auth.ts`, `requireTier.ts`, dashboard |
| `SubscriptionStatus` | `types/user.ts` | `auth.ts`, auth routes tests |
| `TRIAL_DURATION_DAYS` | `constants/tiers.ts` | `billing.service.ts` |
| `TRIAL_PLAN` | `constants/tiers.ts` | (unused in billing directly) |

---

## 6. Shared Plugins/Hooks Coupling

### 6.1 `requireTier` Hook
**File:** `apps/api/src/shared/hooks/requireTier.ts`

- **No billing imports.** Uses `tierAtLeast()` from `@pakulab/shared` and error classes from `../../shared/errors/index.js`.
- Billing routes USE `requireTier` as a preHandler — the coupling is one-way (routes → hook).
- Tier resolution happens in `auth.ts` (reads Subscription from DB). The hook only *reads* `request.user.tier`.

### 6.2 `auth` Plugin
**File:** `apps/api/src/shared/plugins/auth.ts`

- **No billing imports.** Imports `UserTier` and `SubscriptionStatus` TYPES from `@pakulab/shared`.
- Resolves `request.user.tier` by reading Subscription status from DB (trial expiry logic, grace period for PAST_DUE).
- **No function-level coupling to billing module.** This is data-level coupling via the DB.

---

## 7. Error Classes Coupling

**File:** `apps/api/src/shared/errors/index.ts`

Errors used by billing module:

| Error Class | HTTP | Code | Used In |
|------------|------|------|---------|
| `AppError` | var | var | Base class; used for Stripe config errors, webhook errors |
| `NotFoundError` | 404 | `NOT_FOUND` | `createPortalSession` (no stripeCustomerId), `getUserSubscription` |
| `ConflictError` | 409 | `CONFLICT` | `createTrialSubscription` (duplicate active subscription) |

**Not used by billing, but relevant to tier flow:**
- `InsufficientTierError` (403, `INSUFFICIENT_TIER`) — used by `requireTier` hook
- `TrialExpiredError` (402, `TRIAL_EXPIRED`) — not used by billing, defined for future lockout
- `SubscriptionRequiredError` (402) — alias of `TrialExpiredError`

---

## 8. OpenSpec/Specs Coupling

**Directory:** `openspec/changes/google-oauth-authentication/`

All 4 artifacts reference billing:

| Artifact | Mentions |
|----------|----------|
| `proposal.md` | T13: Trial bypass risk for OAuth. Solution: server-side hook calling `createTrialSubscription`. |
| `design.md` | Decision: use BetterAuth `databaseHooks.user.create.after` → call `createTrialSubscription`. Removes frontend trial call for OAuth. |
| `spec.md` | REQ-GOAUTH-03: "The system MUST automatically provision a 21-day TRIALING subscription for every new user created via Google OAuth." Specifies exact function call, ConflictError handling. |
| `tasks.md` | Task 4.1: Modify `auth.config.ts` to import `createTrialSubscription`. Task 4.2: Unit tests with `vi.mock` for `billing.service.ts`. |

---

## 9. Test Coupling

### 9.1 Billing's Own Tests

| File | What It Tests | Dependencies |
|------|--------------|--------------|
| `billing.service.test.ts` | `createTrialSubscription` — status, trialEnd, interval, conflict detection, edge cases | `@pakulab/shared` (TRIAL_DURATION_DAYS), `../../shared/errors/index.js` (ConflictError), mock Prisma |
| `billing.routes.test.ts` | RED tests — verifies route/schema existence by READING source code as strings | `fs/promises`, `path` — reads `.ts` source files at test time |

### 9.2 External Tests That Reference Billing

| File | Reference |
|------|-----------|
| `auth.routes.test.ts` | References `subscriptionStatus` and `trialEnd` in user session-info response shape (no imports) |
| Profile tests | ZERO imports from billing module |
| Dashboard tests | ZERO imports from billing module |

---

## 10. Risk Areas (What Could Break)

### 🔴 HIGH RISK

1. **Auth config — `createTrialSubscription` import** (`auth.config.ts:14`)
   - If the function is removed, renamed, or its signature changes, the entire auth config module fails to load.
   - All signups (email + OAuth) would fail.
   - **Mitigation:** Extract to a domain-level use case with stable interface. Keep the import path working during transition.

2. **Profiles — `deleteUserAccount` import** (`profiles.routes.ts:20`)
   - If removed/moved, the `DELETE /api/profiles/me` route breaks.
   - **Mitigation:** `deleteUserAccount` should be extracted to a dedicated `user-account` port/adapter, not live in billing.

3. **Frontend — `billingStore` API calls**
   - The store calls 5 API endpoints. If routes or response shapes change, the store's TypeScript interfaces (`Subscription`, `CheckoutResponse`, etc.) MUST be updated in sync.
   - The store has its OWN copy of `Subscription` type (lines 16-35 of billingStore.ts) — this is a DRY violation and a desync risk.
   - **Mitigation:** Share types or generate from OpenAPI/contract.

### 🟡 MEDIUM RISK

4. **Auth plugin — DB-level coupling** (`auth.ts` lines 48-50, 59-104)
   - Reads `subscription.status`, `currentPeriodEnd`, `trialEnd` from DB.
   - Has complex tier resolution logic (trial expiry, grace period for PAST_DUE).
   - If the Subscription schema changes, auth tier resolution breaks silently (no type safety across DB reads).
   - **Mitigation:** Tier resolution should be a domain service, not inline in a plugin.

5. **Stripe webhook — raw body capture**
   - The `preParsing` hook is scoped to `/api/billing/*`. If routes move or prefix changes, webhook validation breaks.
   - Stripe webhook is the ONLY route that bypasses JSON parsing.
   - **Mitigation:** Keep webhook endpoint stable or extract to a dedicated webhook adapter.

6. **`Stripe` client singleton** (`billing.service.ts` lines 24-31)
   - Lazy singleton pattern. If `STRIPE_SECRET_KEY` changes at runtime, the cached client is stale.
   - **Mitigation:** Use dependency injection. The client should be injectable.

### 🟢 LOW RISK

7. **`TRIAL_DURATION_DAYS` from `@pakulab/shared`**
   - Only constant import. Already well-isolated.

8. **Error classes from `../../shared/errors/index.js`**
   - `AppError`, `NotFoundError`, `ConflictError`. These are already a shared error layer. Low risk.

9. **Schema coupling** (`billing.schema.ts`)
   - Only used by `billing.routes.ts`. Moving the schema inside billing module is trivial if we keep the module structure.

---

## 11. Hexagonal Refactor — Recommended Extraction Order

Based on this analysis, the refactor should proceed in this sequence (least risky first):

### Phase 1: Extract Ports (No behavior change)

1. **Define `BillingPort` interface** — Extract the 6 public functions into a contract:
   ```typescript
   interface BillingPort {
     createCheckoutSession(input: CheckoutSessionInput): Promise<CheckoutSessionResult>
     createPortalSession(customerId: string): Promise<PortalSessionResult>
     constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event
     handleWebhookEvent(event: Stripe.Event): Promise<void>
     getUserSubscription(userId: string): Promise<Subscription | null>
     createTrialSubscription(input: CreateTrialSubscriptionInput): Promise<Subscription>
     deleteUserAccount(userId: string): Promise<void>
   }
   ```

2. **Extract `deleteUserAccount` to `UserAccountPort`** — This doesn't belong in billing. It deletes ALL user data, billing is just one piece.

### Phase 2: Move Adapters

3. **Create `StripeAdapter`** — Extract Stripe SDK calls (checkout, portal, webhook) behind the port.
4. **Create `PrismaSubscriptionAdapter`** — Extract DB queries behind the port.

### Phase 3: Update Consumers

5. **Update `auth.config.ts`** — Inject `BillingPort` instead of importing `createTrialSubscription` directly.
6. **Update `profiles.routes.ts`** — Inject `UserAccountPort` instead of importing `deleteUserAccount` from billing.
7. **Update `billing.routes.ts`** — Inject `BillingPort` via Fastify decorate or plugin options.

### Phase 4: Extract Tier Resolution

8. **Extract tier resolution from `auth.ts`** — Move `tier` computation to a `TierService` that depends on `BillingPort`.

---

## Summary Matrix

| What | Who Couples | Direction | Risk |
|------|------------|-----------|------|
| `createTrialSubscription` | auth.config.ts | Consumer → Billing | 🔴 HIGH |
| `deleteUserAccount` | profiles.routes.ts | Consumer → Billing | 🔴 HIGH |
| `billingRoutes` plugin | app.ts | Consumer → Billing | 🟢 LOW |
| Stripe SDK | billing.service.ts | Billing → External | 🟡 MED |
| Prisma Subscription | billing.service.ts, auth.ts | Billing ↔ DB | 🟡 MED |
| Error classes | billing.service.ts | Billing → Shared | 🟢 LOW |
| `TRIAL_DURATION_DAYS` | billing.service.ts | Billing → Shared Pkg | 🟢 LOW |
| `requireTier` hook | billing.routes.ts | Billing → Shared Hook | 🟢 LOW |
| `requireAuth` hook | billing.routes.ts | Billing → Shared Hook | 🟢 LOW |
| Frontend `billingStore` | 6 Vue components | Frontend → API | 🟡 MED |
| `authStore` dynamic import | authStore.ts | Frontend → billingStore | 🟡 MED |
| `auth.ts` plugin | DB read | Auth → DB (read-only) | 🟡 MED |
| OpenSpec specs | google-oauth-auth | Specs → Billing | 🟢 LOW |
