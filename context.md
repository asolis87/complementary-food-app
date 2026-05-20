# Code Context — Stripe Integration Analysis for Pakulab

## Files Retrieved

| # | File | Lines | Why it matters |
|---|------|-------|----------------|
| 1 | `apps/api/src/modules/billing/billing.routes.ts` | 1-139 | Stripe webhook, checkout, portal, trial routes |
| 2 | `apps/api/src/modules/billing/billing.service.ts` | 1-340 | Core Stripe integration: checkout sessions, webhook handlers, trial creation, account deletion |
| 3 | `apps/api/src/modules/billing/billing.schema.ts` | 1-17 | Zod schemas for checkout + trial input |
| 4 | `apps/api/src/modules/billing/billing.service.test.ts` | 1-313 | Unit tests for trial subscription creation |
| 5 | `apps/api/src/modules/billing/billing.routes.test.ts` | 1-260 | RED tests for start-trial endpoint |
| 6 | `apps/api/src/app.ts` | 1-155 | Fastify app factory, plugin registration, route mounting |
| 7 | `apps/api/src/server.ts` | 1-20 | Server entry point (port 3002) |
| 8 | `apps/api/src/shared/plugins/auth.ts` | 1-105 | Auth plugin: session extraction + tier resolution (trial expiry, grace period) |
| 9 | `apps/api/src/shared/plugins/prisma.ts` | 1-25 | Prisma client decorator |
| 10 | `apps/api/src/shared/plugins/origin-guard.ts` | 1-55 | CSRF defense; exempts `/api/billing/webhook` |
| 11 | `apps/api/src/shared/hooks/requireAuth.ts` | 1-12 | Auth preHandler |
| 12 | `apps/api/src/shared/hooks/requireTier.ts` | 1-62 | Tier-gating preHandler (FREE/PRO) |
| 13 | `apps/api/src/shared/errors/index.ts` | 1-85 | Centralized error classes (TrialExpiredError, InsufficientTierError, ConflictError...) |
| 14 | `apps/api/src/modules/profiles/profiles.routes.ts` | 1-140 | Profiles CRUD; imports `deleteUserAccount` from billing.service |
| 15 | `apps/api/src/modules/auth/auth.config.ts` | 1-190 | BetterAuth config; auto-provisions trial on user creation |
| 16 | `apps/api/src/modules/auth/auth.routes.ts` | 1-82 | Auth routes + `/session-info` endpoint |
| 17 | `prisma/schema.prisma` | 1-290 | All 13 models including Subscription, User, Plate, FoodLog, WeeklyMenu... |
| 18 | `packages/shared/src/constants/tiers.ts` | 1-68 | Tier limits, pricing (MXN cents), trial duration, feature matrix |
| 19 | `packages/shared/src/types/user.ts` | 1-31 | UserTier, SubscriptionStatus, AuthUser types |
| 20 | `packages/shared/src/index.ts` | 1-82 | Shared package public API |
| 21 | `apps/web/src/shared/stores/billingStore.ts` | 1-152 | Frontend Pinia billing store (Stripe checkout, portal, trial, account deletion) |
| 22 | `apps/api/package.json` | 1-43 | API dependencies (stripe@^21.0.1, resend, better-auth, fastify...) |
| 23 | `package.json` | 1-35 | Root monorepo scripts + devDependencies |
| 24 | `openspec/config.yaml` | 1-44 | SDD config: strict TDD, vitest runner, Stripe in stack |
| 25 | `.env.example` | 1-27 | All env vars (Stripe, BetterAuth, Google OAuth, database) |
| 26 | `PROJECT_CONTEXT.md` | 1-275 | Full project context: stack, architecture, business model, implementation state |
| 27 | `docker-compose.staging.yml` | 1-95 | Staging deployment with Stripe, Resend, BetterAuth env vars |
| 28 | `docs/SECURITY_AUDIT_OWASP_2021.md` | 1-100 | Security audit; Stripe webhook signature verification confirmed |
| 29 | `docs/dashboard.md` | 1-355 | Dashboard design (not directly Stripe-related) |
| 30 | `apps/api/src/modules/disclaimer/domain/ports/disclaimer.repository.port.ts` | 1-36 | Hexagonal port pattern example |
| 31 | `apps/api/src/modules/email/domain/ports/email.port.ts` | 1-34 | Email port (Resend + ConsoleLog adapters) |

---

## Full File Tree: `apps/api/src/`

```
apps/api/src/
├── app.ts                          # Fastify app factory
├── app.test.ts                     # parseTrustProxy tests
├── server.ts                       # Entry point (PORT 3002)
├── modules/
│   ├── allergens/
│   │   └── allergens.routes.ts
│   ├── auth/
│   │   ├── auth.config.ts          # BetterAuth config + trial auto-provision
│   │   ├── auth.config.test.ts
│   │   ├── auth.routes.ts          # Auth routes + /session-info
│   │   └── auth.routes.test.ts
│   ├── billing/                    # ★ STRIPE MODULE
│   │   ├── billing.routes.ts       # /create-checkout, /create-portal, /webhook, /subscription, /start-trial
│   │   ├── billing.routes.test.ts
│   │   ├── billing.schema.ts       # createCheckoutSchema, startTrialSchema
│   │   ├── billing.service.ts      # All Stripe logic + webhook handlers + trial + account deletion
│   │   └── billing.service.test.ts
│   ├── dashboard/
│   │   ├── dashboard.routes.ts
│   │   ├── dashboard.routes.test.ts
│   │   ├── dashboard.schemas.ts
│   │   ├── dashboard.service.ts
│   │   ├── dashboard.service.test.ts
│   │   └── dashboard.types.ts
│   ├── diary/
│   │   ├── diary.routes.ts
│   │   ├── diary.schemas.ts
│   │   ├── diary.schemas.test.ts
│   │   ├── diary.utils.ts
│   │   ├── diary.utils.test.ts
│   │   ├── dayObservation.routes.ts
│   │   ├── dayObservation.routes.test.ts
│   │   ├── dayObservation.schemas.ts
│   │   ├── range.routes.ts
│   │   └── range.routes.test.ts
│   ├── disclaimer/                 # ★ HEXAGONAL EXAMPLE
│   │   ├── disclaimer.constants.ts
│   │   ├── disclaimer.routes.ts
│   │   ├── disclaimer.routes.integration.test.ts
│   │   ├── disclaimer.service.ts
│   │   ├── disclaimer.service.test.ts
│   │   ├── disclaimer.repository.test.ts
│   │   ├── domain/
│   │   │   └── ports/
│   │   │       └── disclaimer.repository.port.ts
│   │   └── infrastructure/
│   │       └── adapters/
│   │           └── prisma-disclaimer.repository.ts
│   ├── email/                      # ★ HEXAGONAL EXAMPLE
│   │   ├── email.service.ts
│   │   ├── domain/
│   │   │   └── ports/
│   │   │       ├── email.port.ts
│   │   │       └── email.port.test.ts
│   │   └── infrastructure/
│   │       ├── adapters/
│   │       │   ├── console-log.adapter.ts
│   │       │   ├── console-log.adapter.test.ts
│   │       │   ├── resend.adapter.ts
│   │       │   └── resend.adapter.test.ts
│   │       └── templates/
│   │           └── email-templates.ts
│   ├── foods/
│   │   ├── foods.routes.ts
│   │   ├── foods.schema.ts
│   │   └── foods.service.ts
│   ├── health/
│   │   └── health.routes.ts
│   ├── menus/
│   │   ├── menus.routes.ts
│   │   ├── menus.routes.test.ts
│   │   ├── menus.schemas.ts
│   │   ├── menus.schemas.test.ts
│   │   ├── menus.service.ts
│   │   └── menus.service.test.ts
│   ├── plates/
│   │   ├── plates.routes.ts
│   │   ├── plates.schema.ts
│   │   └── plates.service.ts
│   └── profiles/
│       └── profiles.routes.ts     # Imports deleteUserAccount from billing
└── shared/
    ├── errors/
    │   └── index.ts               # AppError, TrialExpiredError, InsufficientTierError...
    ├── hooks/
    │   ├── requireAuth.ts
    │   └── requireTier.ts         # requireTier('PRO') / requireTier('FREE')
    ├── plugins/
    │   ├── auth.ts                # Session extraction + tier resolution
    │   ├── auth.plugin.integration.test.ts
    │   ├── cache-control.ts
    │   ├── cache-control.test.ts
    │   ├── origin-guard.ts        # CSRF defense (exempts /api/billing/webhook)
    │   ├── origin-guard.test.ts
    │   └── prisma.ts
    ├── types.ts
    └── utils/
        ├── sanitize.ts
        └── sanitize.test.ts
```

---

## Module Structure (Screaming Architecture)

The codebase follows **screaming/modular monolith** architecture with 13 modules. Only 2 modules (`disclaimer`, `email`) follow full hexagonal structure with `domain/ports` and `infrastructure/adapters`. Others use a simpler service-route pattern.

| Module | Routes | Service | Schema | Tests | Hexagonal? |
|--------|--------|---------|--------|-------|------------|
| **allergens** | ✅ | ❌ | ❌ | ❌ | No |
| **auth** | ✅ (BetterAuth) | ❌ (config only) | ❌ | ✅ | No |
| **billing** | ✅ | ✅ | ✅ | ✅ | No (flat) |
| **dashboard** | ✅ | ✅ | ✅ | ✅ | No |
| **diary** | ✅ (3 sub-routes) | ❌ | ✅ | ✅ | No |
| **disclaimer** | ✅ | ✅ | ❌ | ✅ | ✅ Full hexagonal |
| **email** | ❌ (service only) | ✅ | ❌ | ✅ | ✅ Full hexagonal |
| **foods** | ✅ | ✅ | ✅ | ❌ | No |
| **health** | ✅ | ❌ | ❌ | ❌ | No |
| **menus** | ✅ | ✅ | ✅ | ✅ | No |
| **plates** | ✅ | ✅ | ✅ | ❌ | No |
| **profiles** | ✅ | ❌ | ❌ (inline Zod) | ❌ | No |

---

## Prisma Schema — All Models

### Auth (BetterAuth managed)
- **User** — id, name, email, emailVerified, image, isAnonymous, timestamps
- **Session** — token, userId, expiresAt, ipAddress, userAgent
- **Account** — providerId, accountId, userId, OAuth tokens
- **Verification** — identifier, value, expiresAt

### Domain Models
- **BabyProfile** — name, birthDate, acStartDate, notes (soft delete)
- **Food** — name (unique), group (enum), alClassification (enum), alScore, isAllergen, allergenType, ageMonths, description, needsValidation
- **Plate** — userId, babyProfileId, name, groupCount (4/5), balanceScore, astringentCount, laxativeCount, neutralCount (soft delete)
- **PlateItem** — plateId, foodId, groupAssignment, servingAmount
- **FoodLog** — userId, babyProfileId, foodId, date, time, mealType, reaction, accepted, plateBalanceLabel, plateId, notes (soft delete)
- **DayObservation** — babyProfileId, date, stool, symptoms[], notes
- **WeeklyMenu** — userId, babyProfileId, weekStart, balanceScore (soft delete)
- **MenuDay** — menuId, dayOfWeek (0-6)
- **MenuMeal** — menuDayId, mealType, plateId, notes, servedAt

### Payments (Billing)
- **Subscription** — `userId` (unique), `stripeCustomerId`, `stripeSubId`, `stripePriceId`, `status` (enum: ACTIVE|TRIALING|PAST_DUE|CANCELED|EXPIRED), `interval` (MONTHLY|YEARLY), `currentPeriodEnd`, `trialEnd`, `cancelAtPeriodEnd`, `canceledAt`

### Legal
- **DisclaimerAcceptance** — userId, version, acceptedAt, userAgent, ipAddress

### Enums
- `FoodGroup`: FRUIT, VEGETABLE, PROTEIN, CEREAL_TUBER, HEALTHY_FAT
- `ALClassification`: ASTRINGENT, LAXATIVE, NEUTRAL
- `ReactionType`: LIKED, DISLIKED, NEUTRAL, REJECTED
- `StoolType`: NORMAL, LOOSE, HARD, NONE
- `SymptomType`: ALLERGY_SUSPECT, RASH, GAS, VOMITING, FEVER
- `MealType`: BREAKFAST, LUNCH, DINNER, SNACK_1, SNACK_2, SNACK
- `SubscriptionStatus`: ACTIVE, TRIALING, PAST_DUE, CANCELED, EXPIRED
- `BillingInterval`: MONTHLY, YEARLY

---

## Stripe Integration — Complete Map

### Billing Routes (`apps/api/src/modules/billing/billing.routes.ts`)

| Route | Method | Auth | Tier | Purpose |
|-------|--------|------|------|---------|
| `/api/billing/create-checkout` | POST | requireAuth | FREE+ | Creates Stripe Checkout session, returns redirect URL |
| `/api/billing/create-portal` | POST | requireAuth | PRO (implicit) | Creates Stripe Customer Portal session |
| `/api/billing/webhook` | POST | NONE | N/A | Receives signed Stripe webhooks (raw body via preParsing hook) |
| `/api/billing/subscription` | GET | requireAuth | FREE+ | Returns current subscription record |
| `/api/billing/start-trial` | POST | requireAuth | FREE+ | Creates local trial subscription (no Stripe) |

### Billing Service (`apps/api/src/modules/billing/billing.service.ts`)

**Stripe Client** (lines 17-37):
- Lazy singleton: `createStripeClient()` reads `STRIPE_SECRET_KEY` from env
- Uses API version `2026-03-25.dahlia` (SDK v21)

**Exported Functions:**

| Function | Purpose |
|----------|---------|
| `createCheckoutSession(prisma, { userId, userEmail, priceId })` | Creates Stripe Checkout session in `subscription` mode, MXN currency, promotion codes enabled. Returns `{ url, sessionId }` |
| `createPortalSession(customerId)` | Creates Stripe Billing Portal session. Returns `{ url }` |
| `getUserSubscription(prisma, userId)` | Returns subscription record or null |
| `createTrialSubscription(prisma, { userId, plan })` | Creates/upserts TRIALING subscription (21 days). Throws ConflictError if ACTIVE/TRIALING already exists |
| `constructWebhookEvent(payload, signature)` | Verifies webhook signature using `STRIPE_WEBHOOK_SECRET` |
| `handleWebhookEvent(prisma, event)` | Routes webhook events to internal handlers |
| `deleteUserAccount(prisma, userId)` | Complete GDPR account wipe via Prisma transaction |

**Webhook Event Handlers:**

| Event | Handler | Action |
|-------|---------|--------|
| `checkout.session.completed` | `handleCheckoutCompleted` | Upserts subscription with stripeCustomerId, stripeSubId, stripePriceId, status, interval, periods |
| `customer.subscription.updated` | `handleSubscriptionUpdated` | Updates status, interval, cancelAtPeriodEnd, canceledAt |
| `customer.subscription.deleted` | `handleSubscriptionDeleted` | Sets status = CANCELED |
| `invoice.paid` | `handleInvoicePaid` | Sets status = ACTIVE |
| `invoice.payment_failed` | `handleInvoicePaymentFailed` | Sets status = PAST_DUE (3-day grace period) |

**SDK v21 Breaking Changes Handled:**
- `Subscription.current_period_end` → REMOVED. Uses `SubscriptionItem.current_period_end` (`subscription.items.data[0]?.current_period_end`)
- `Invoice.subscription` → REMOVED. Uses `invoice.parent?.subscription_details?.subscription`

### Stripe References in Frontend

**`apps/web/src/shared/stores/billingStore.ts`** — Pinia store:
- `fetchSubscription()` — GET `/api/billing/subscription`
- `createCheckout(priceId)` — POST `/api/billing/create-checkout` → `window.location.href` redirect
- `openPortal()` — POST `/api/billing/create-portal` → `window.location.href` redirect
- `startTrial(plan)` — POST `/api/billing/start-trial`
- `deleteAccount()` — DELETE `/api/profiles/me` (wipes everything)

**Frontend billing pages:**
- `apps/web/src/modules/billing/PricingPage.vue` — Plan selection + Stripe checkout trigger
- `apps/web/src/modules/billing/PaywallPage.vue` — Post-trial expiration paywall
- `apps/web/src/modules/billing/PlanSelectionPage.vue` — Trial onboarding
- `apps/web/src/modules/billing/CheckoutSuccessPage.vue` — Stripe redirect landing
- `apps/web/src/modules/billing/CheckoutCancelPage.vue` — Stripe redirect landing

### Trial-First Model

**Flow:**
1. User signs up (email or Google OAuth) → `auth.config.ts` database hook `user.create.after` auto-provisions 21-day trial
2. Trial created via `createTrialSubscription(prisma, { userId, plan: 'TRIAL' })`
3. Subscription stored locally (no Stripe): status=TRIALING, stripeCustomerId=null, stripeSubId=null
4. During trial, user has full PRO access
5. Trial expires → tier resolution in `auth.ts` sets tier=FREE (expires at end of trial day, 23:59:59)
6. User redirected to paywall → chooses plan → Stripe Checkout → webhook syncs subscription

**Tier Resolution Logic** (`shared/plugins/auth.ts`, lines 59-105):
- TRIALING + not expired → PRO
- ACTIVE → PRO
- PAST_DUE + within 3-day grace period (currentPeriodEnd + 3 days) → PRO
- EXPIRED / CANCELED → FREE
- No subscription → FREE

---

## Tier Limits & Pricing

From `packages/shared/src/constants/tiers.ts`:

| Tier | Saved Plates | Baby Profiles | Diary Window | Export Clean | Menu | Allergens |
|------|-------------|---------------|-------------|-------------|------|-----------|
| FREE (locked) | 0 | 0 | 0 | ❌ | ❌ | ❌ |
| PRO | ∞ | 3 | ∞ | ✅ | ✅ | ✅ |

**Pricing (MXN):**
- Monthly: $99 MXN (`PRICING.monthly.amountMxn = 9900` cents)
- Yearly: $999 MXN (`PRICING.yearly.amountMxn = 99900` cents, "Ahorra 17%")

**Trial:** 21 days (`TRIAL_DURATION_DAYS`)

---

## Environment Variables (Stripe-Related)

From `.env.example` and `docker-compose.staging.yml`:

| Variable | Required | Purpose |
|----------|----------|---------|
| `STRIPE_SECRET_KEY` | Yes (for billing) | Stripe secret key (`sk_test_...` or `sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | Yes (for billing) | Stripe webhook signing secret (`whsec_...`) |
| `STRIPE_PRICE_ID_MONTHLY` | Optional (env.example) | Price ID for monthly plan |
| `STRIPE_PRICE_ID_YEARLY` | Optional (env.example) | Price ID for yearly plan |
| `STRIPE_PRICE_MONTHLY` | Staging | Docker staging variant |
| `STRIPE_PRICE_YEARLY` | Staging | Docker staging variant |
| `STRIPE_SUCCESS_URL` | Optional | Redirect after successful checkout (default: localhost:5173/billing/success) |
| `STRIPE_CANCEL_URL` | Optional | Redirect after cancelled checkout (default: localhost:5173/billing/cancel) |
| `BETTER_AUTH_SECRET` | Yes | Session signing secret (min 32 chars) |
| `BETTER_AUTH_URL` | Yes | Base URL for BetterAuth |
| `CORS_ORIGIN` | Yes | CORS allowed origin |
| `FRONTEND_URL` | Yes | Frontend URL (for origin-guard) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth client secret |
| `RESEND_API_KEY` | Required (prod) | Resend email API key |
| `RESEND_FROM_EMAIL` | Optional | Sender email address |

---

## Package Dependencies

### Root (`package.json`)
- `@playwright/test`, `typescript`, `eslint`, `prettier`
- Monorepo orchestration scripts only

### API (`apps/api/package.json`)
| Dep | Version | Purpose |
|-----|---------|---------|
| `fastify` | ^5.0.0 | HTTP framework |
| `@prisma/client` | ^5.22.0 | ORM |
| `better-auth` | ^1.2.0 | Authentication |
| **`stripe`** | **^21.0.1** | **Stripe SDK** |
| `resend` | ^6.12.2 | Email delivery |
| `zod` | ^3.23.0 | Validation |
| `sanitize-html` | ^2.17.3 | XSS sanitization |
| `@fastify/cors`, `@fastify/helmet`, `@fastify/rate-limit` | ^11, ^13, ^10 | Fastify plugins |
| `@pakulab/shared` | workspace:* | Shared types/constants/utils |

### Shared (`packages/shared/`)
- Pure TypeScript package — types, constants, balance engine, tier limits
- No runtime dependencies

---

## Hexagonal Architecture Patterns (for reference)

Only `disclaimer` and `email` modules implement full hexagonal:

**Disclaimer module:**
- Port: `domain/ports/disclaimer.repository.port.ts` — `DisclaimerRepository` interface
- Adapter: `infrastructure/adapters/prisma-disclaimer.repository.ts` — `PrismaDisclaimerRepository` class

**Email module:**
- Port: `domain/ports/email.port.ts` — `EmailPort` interface
- Adapters: `console-log.adapter.ts`, `resend.adapter.ts`

**Billing module** does NOT use hexagonal architecture — it imports Prisma directly in the service layer. If a billing hexagonal refactor is needed, the pattern is established in `disclaimer/` and `email/`.

---

## Documentation About Payments/Stripe

- **PROJECT_CONTEXT.md** lines 29, 44, 158, 171, 186-192 — Business model (freemium), Stripe MXN, Phase 4 completion, SDK v21 breaking changes documented
- **README.md** lines 15, 81-83 — Stripe env vars listed
- **docs/SECURITY_AUDIT_OWASP_2021.md** line 75 — Webhook signature verification confirmed as implemented
- **complementary_food.md** — Original problem/solution doc; mentions PRO subscription
- **openspec/config.yaml** line 4 — Stripe listed in stack context

---

## Key Architectural Decisions Affecting Stripe

1. **AD-04 (trial-first model):** Users auto-start 21-day trial. Stripe only engaged at checkout.
2. **AD-05 (Stripe Checkout):** Free → Pro flow via Stripe Checkout hosted page.
3. **Webhook raw body:** Scoped `preParsing` hook (not global) in billing.routes.ts captures raw Buffer for signature verification.
4. **Origin guard exemption:** `/api/billing/webhook` is exempt from CSRF origin validation (Stripe doesn't send browser Origin).
5. **Grace period:** 3 days of PRO access after PAST_DUE status.
6. **GDPR deletion:** `deleteUserAccount` in billing.service.ts performs Prisma transaction wipe.
7. **`@pakulab/shared`** contains tier constants and pricing — shared between API and frontend.

---

## Start Here

1. **`apps/api/src/modules/billing/billing.service.ts`** — The core Stripe integration file. Contains all checkout, portal, webhook, trial, and account deletion logic.
2. **`apps/api/src/modules/billing/billing.routes.ts`** — Route definitions and the critical `preParsing` hook for Stripe webhook raw body capture.
3. **`prisma/schema.prisma`** — The `Subscription` model and `SubscriptionStatus` enum.
4. **`apps/api/src/shared/plugins/auth.ts`** — Tier resolution logic that determines PRO access (trial expiry, grace period).
5. **`packages/shared/src/constants/tiers.ts`** — Pricing constants, tier limits, trial duration.
