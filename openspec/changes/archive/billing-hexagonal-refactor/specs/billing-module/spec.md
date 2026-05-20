# Spec: Billing Module — Hexagonal Refactor Behavioral Invariants

> Status: draft
> Change: billing-hexagonal-refactor
> Capability: billing-module

## Overview

This spec defines the behavioral invariants that the hexagonal refactor MUST preserve. The refactor changes internal structure only — no functional behavior shall change. Every scenario below describes a contract that existed before the refactor and must hold after.

---

## REQ-BH-01: Checkout Session Creation

The system SHALL accept a POST request to create a Stripe Checkout session and return a redirect URL.

### Scenario: Authenticated FREE user creates checkout session

- **GIVEN** a user is authenticated with FREE tier or higher
- **AND** their subscription has no `stripeCustomerId`
- **WHEN** they POST to `/api/billing/create-checkout` with `{ priceId: "price_xxx" }`
- **THEN** the system SHALL create a Stripe Checkout session in `subscription` mode with MXN currency
- **AND** the session SHALL include the user's email as `customer_email`
- **AND** the response SHALL be `{ data: { url: string, sessionId: string } }`

### Scenario: Returning subscriber creates checkout session

- **GIVEN** a user is authenticated
- **AND** their subscription HAS a `stripeCustomerId`
- **WHEN** they POST to `/api/billing/create-checkout` with `{ priceId: "price_xxx" }`
- **THEN** the session SHALL be attached to the existing `stripeCustomerId`
- **AND** the response SHALL be `{ data: { url: string, sessionId: string } }`

### Scenario: Unauthenticated user is rejected

- **GIVEN** a request without a valid session
- **WHEN** they POST to `/api/billing/create-checkout`
- **THEN** the system SHALL return 401 Unauthorized

---

## REQ-BH-02: Portal Session Creation

The system SHALL return a Stripe Customer Portal URL for users with an active Stripe subscription.

### Scenario: PRO user opens billing portal

- **GIVEN** a user is authenticated
- **AND** their subscription has a `stripeCustomerId`
- **WHEN** they POST to `/api/billing/create-portal`
- **THEN** the system SHALL create a Stripe Billing Portal session
- **AND** the response SHALL be `{ data: { url: string } }`

### Scenario: User without Stripe customer is rejected

- **GIVEN** a user is authenticated
- **AND** their subscription has NO `stripeCustomerId`
- **WHEN** they POST to `/api/billing/create-portal`
- **THEN** the system SHALL return 404 with code `NOT_FOUND`

---

## REQ-BH-03: Webhook Processing

The system SHALL receive, verify, and process Stripe webhook events without authentication.

### Scenario: Valid webhook is processed — checkout completed

- **GIVEN** a signed Stripe webhook event of type `checkout.session.completed`
- **AND** the event contains valid `metadata.userId`
- **WHEN** it POSTs to `/api/billing/webhook` with a valid `stripe-signature` header
- **THEN** the system SHALL verify the signature using `STRIPE_WEBHOOK_SECRET`
- **AND** SHALL upsert the Subscription row with `stripeCustomerId`, `stripeSubId`, `stripePriceId`, status, interval
- **AND** SHALL return `{ received: true }`

### Scenario: Valid webhook — subscription updated

- **GIVEN** a signed event of type `customer.subscription.updated`
- **WHEN** it POSTs to `/api/billing/webhook`
- **THEN** the system SHALL update the Subscription's status, interval, `cancelAtPeriodEnd`, `canceledAt`

### Scenario: Valid webhook — subscription deleted

- **GIVEN** a signed event of type `customer.subscription.deleted`
- **WHEN** it POSTs to `/api/billing/webhook`
- **THEN** the system SHALL set status to `CANCELED` and `canceledAt` to current timestamp

### Scenario: Valid webhook — invoice paid

- **GIVEN** a signed event of type `invoice.paid`
- **WHEN** it POSTs to `/api/billing/webhook`
- **THEN** the system SHALL set status to `ACTIVE`

### Scenario: Valid webhook — invoice payment failed

- **GIVEN** a signed event of type `invoice.payment_failed`
- **WHEN** it POSTs to `/api/billing/webhook`
- **THEN** the system SHALL set status to `PAST_DUE`

### Scenario: Webhook with invalid signature is rejected

- **GIVEN** an unsigned or incorrectly signed payload
- **WHEN** it POSTs to `/api/billing/webhook`
- **THEN** the system SHALL return 400 with code `WEBHOOK_SIGNATURE_INVALID`

### Scenario: Webhook without stripe-signature header

- **GIVEN** a POST without the `stripe-signature` header
- **WHEN** it POSTs to `/api/billing/webhook`
- **THEN** the system SHALL return 400 with code `MISSING_STRIPE_SIGNATURE`

### Scenario: Webhook without raw body

- **GIVEN** a request where `rawBody` is not attached (preParsing hook failed)
- **WHEN** it POSTs to `/api/billing/webhook`
- **THEN** the system SHALL return 500 with code `RAW_BODY_MISSING`

### Scenario: CSRF exemption for webhook

- **GIVEN** a POST to `/api/billing/webhook`
- **WHEN** the Origin header is absent or mismatched
- **THEN** the origin-guard middleware SHALL NOT reject the request

---

## REQ-BH-04: Subscription Retrieval

The system SHALL return the current subscription record for the authenticated user.

### Scenario: User has an active subscription

- **GIVEN** an authenticated user with a Subscription row
- **WHEN** they GET `/api/billing/subscription`
- **THEN** the response SHALL be `{ data: { id, status, interval, stripePriceId, stripeCustomerId, currentPeriodEnd, trialEnd, cancelAtPeriodEnd, canceledAt, createdAt } }`

### Scenario: User has no subscription

- **GIVEN** an authenticated user without a Subscription row
- **WHEN** they GET `/api/billing/subscription`
- **THEN** the response SHALL be `{ data: null }`

---

## REQ-BH-05: Trial Subscription Creation

The system SHALL create a local trial subscription (no Stripe) for authenticated users.

### Scenario: New user starts trial

- **GIVEN** an authenticated user without a Subscription
- **WHEN** they POST to `/api/billing/start-trial` with `{ plan: "TRIAL" }`
- **THEN** the system SHALL create a Subscription with status `TRIALING`
- **AND** `trialEnd` SHALL be exactly `TRIAL_DURATION_DAYS` (21) days from now
- **AND** `currentPeriodEnd` SHALL equal `trialEnd`
- **AND** `interval` SHALL be `MONTHLY`
- **AND** `stripeCustomerId`, `stripeSubId`, `stripePriceId` SHALL be null
- **AND** `cancelAtPeriodEnd` SHALL be false
- **AND** the response SHALL be `{ data: Subscription }` with HTTP 201

### Scenario: User with expired subscription restarts trial

- **GIVEN** an authenticated user with status `CANCELED` or `EXPIRED`
- **WHEN** they POST to `/api/billing/start-trial`
- **THEN** the system SHALL create a new TRIALING subscription (upsert)

### Scenario: User with active subscription is rejected

- **GIVEN** an authenticated user with status `ACTIVE` or `TRIALING`
- **WHEN** they POST to `/api/billing/start-trial`
- **THEN** the system SHALL return 409 with code `CONFLICT`

### Scenario: Invalid plan value is rejected

- **GIVEN** an authenticated user
- **WHEN** they POST to `/api/billing/start-trial` with `{ plan: "INVALID" }`
- **THEN** the system SHALL return 400 validation error

---

## REQ-BH-06: Account Deletion

The system SHALL delete all user data atomically via Prisma transaction.

### Scenario: User deletes their account

- **GIVEN** an authenticated user with baby profiles, plates, food logs, menus, and a subscription
- **WHEN** they DELETE `/api/profiles/me`
- **THEN** the system SHALL delete all PlateItems, Plates, FoodLogs, MenuMeals, MenuDays, WeeklyMenus, BabyProfiles, Subscription, Sessions, Accounts, and the User
- **AND** the deletion SHALL be atomic (all or nothing via `$transaction`)
- **AND** PlateItems SHALL be deleted before Plates (FK constraint)

---

## REQ-BH-07: Auth Auto-Provision Compatibility

The auth module SHALL continue to provision a trial subscription for every new user.

### Scenario: Email signup provisions trial

- **GIVEN** a new user signs up via email/password
- **WHEN** BetterAuth fires the `user.create.after` database hook
- **THEN** the system SHALL call `createTrialSubscription` with `{ userId, plan: 'TRIAL' }`

### Scenario: Google OAuth signup provisions trial

- **GIVEN** a new user signs up via Google OAuth
- **WHEN** BetterAuth fires the `user.create.after` database hook
- **THEN** the system SHALL call `createTrialSubscription` with `{ userId, plan: 'TRIAL' }`

### Scenario: Trial provisioning failure does not block signup

- **GIVEN** `createTrialSubscription` throws an error
- **WHEN** the `user.create.after` hook catches it
- **THEN** the user SHALL still be created successfully
- **AND** the error SHALL be logged with `console.error`

---

## REQ-BH-08: Tier Resolution Compatibility

The auth plugin SHALL continue to resolve user tier from the Subscription row.

### Scenario: TRIALING subscription within trial period → PRO

- **GIVEN** a subscription with status `TRIALING` and `trialEnd` in the future
- **WHEN** the auth plugin resolves tier on request
- **THEN** `request.user.tier` SHALL be `'PRO'`

### Scenario: TRIALING subscription past trial end → FREE

- **GIVEN** a subscription with status `TRIALING` and `trialEnd` before now (end of that day)
- **WHEN** the auth plugin resolves tier
- **THEN** `request.user.tier` SHALL be `'FREE'`
- **AND** `request.user.subscriptionStatus` SHALL be `'EXPIRED'`

### Scenario: ACTIVE subscription → PRO

- **GIVEN** a subscription with status `ACTIVE`
- **WHEN** the auth plugin resolves tier
- **THEN** `request.user.tier` SHALL be `'PRO'`

### Scenario: PAST_DUE within grace period → PRO

- **GIVEN** a subscription with status `PAST_DUE` and `currentPeriodEnd` within the last 3 days
- **WHEN** the auth plugin resolves tier
- **THEN** `request.user.tier` SHALL be `'PRO'`

### Scenario: CANCELED/EXPIRED → FREE

- **GIVEN** a subscription with status `CANCELED` or `EXPIRED`
- **WHEN** the auth plugin resolves tier
- **THEN** `request.user.tier` SHALL be `'FREE'`

---

## REQ-BH-09: Hexagonal Structure Compliance

The refactored module SHALL follow hexagonal architecture conventions.

### Scenario: Domain layer has no infrastructure imports

- **GIVEN** the refactored billing module
- **WHEN** we grep for `from.*infrastructure` in `modules/billing/domain/`
- **THEN** the result SHALL be empty

### Scenario: Application layer has no infrastructure imports (except DI)

- **GIVEN** the refactored billing module
- **WHEN** we grep for `from.*infrastructure` in `modules/billing/application/`
- **THEN** the result SHALL be empty

### Scenario: Ports are defined in domain layer

- **GIVEN** the refactored billing module
- **THEN** `BillingPort`, `SubscriptionRepository`, `UserAccountPort` interfaces SHALL exist in `domain/ports/`

### Scenario: Adapters implement ports

- **GIVEN** the refactored billing module
- **THEN** `StripePaymentGatewayAdapter` SHALL `implements BillingPort`
- **AND** `PrismaSubscriptionRepository` SHALL `implements SubscriptionRepository`

### Scenario: Use cases depend on ports, not adapters

- **GIVEN** any use case in `application/use-cases/`
- **THEN** its constructor SHALL accept port interfaces (e.g., `BillingPort`, `SubscriptionRepository`)
- **AND** SHALL NOT accept concrete adapters or PrismaClient directly

---

## REQ-BH-10: Existing Tests Must Pass

All 25 existing billing tests SHALL continue to pass after the refactor.

### Scenario: createTrialSubscription unit tests pass

- **GIVEN** the 15 tests in `billing.service.test.ts` adapted to the new module structure
- **WHEN** `pnpm --filter api test src/modules/billing/` is run
- **THEN** all 15 tests SHALL pass

### Scenario: start-trial route tests pass

- **GIVEN** the 10 tests in `billing.routes.test.ts` adapted to the new structure
- **WHEN** `pnpm --filter api test src/modules/billing/` is run
- **THEN** all 10 tests SHALL pass

---

## REQ-BH-11: TypeScript Compilation

The entire monorepo SHALL compile without errors.

### Scenario: Type check passes in all packages

- **GIVEN** the refactored codebase
- **WHEN** `pnpm typecheck` is run
- **THEN** it SHALL exit with code 0
- **AND** there SHALL be no `any` types introduced

---

## Non-Requirements (Explicitly Out of Spec)

The following are explicitly NOT required by this spec:

- Unit tests for checkout/webhook Stipe operations (separate SDD)
- Idempotency key support
- Retry logic for transient Stripe errors
- Email synchronization with Stripe customer
- Invoice history endpoint
- Domain event emission after webhooks
- Tier resolution extraction from auth plugin
- Stripe test/live mode detection
- Webhook event tracking for unhandled types
