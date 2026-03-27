/**
 * Billing service — Stripe integration for CFA subscriptions.
 * Spec: REQ-PAY-01, REQ-PAY-02
 * Design: AD5 — Free → Pro flow via Stripe Checkout.
 *
 * NOTE: Uses Stripe SDK v21 (API 2026-03-25.dahlia).
 * Breaking changes from v10:
 *   - Subscription no longer has `current_period_end` — it's on SubscriptionItem
 *   - Invoice.subscription is now at Invoice.parent.subscription_details.subscription
 */

import Stripe from 'stripe'
import type { PrismaClient } from '@prisma/client'
import { TRIAL_TRIGGER } from '@cfa/shared'
import { AppError } from '../../shared/errors/index.js'

// ─── Stripe client ─────────────────────────────────────────────────────────

function createStripeClient(): Stripe {
  const secretKey = process.env['STRIPE_SECRET_KEY']
  if (!secretKey) {
    throw new AppError('STRIPE_SECRET_KEY no configurado', 500, 'STRIPE_CONFIG_ERROR')
  }
  return new Stripe(secretKey, {
    apiVersion: '2026-03-25.dahlia',
    typescript: true,
  })
}

// Lazy singleton — only instantiated when first used
let _stripe: Stripe | undefined

function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = createStripeClient()
  }
  return _stripe
}

// ─── Trial eligibility ─────────────────────────────────────────────────────

/**
 * User is eligible for a 7-day trial if they have ≥3 saved plates OR ≥3 diary days.
 * Spec: REQ-PAY-01 — trial trigger threshold.
 */
export async function isEligibleForTrial(prisma: PrismaClient, userId: string): Promise<boolean> {
  const [plateCount, diaryDays] = await Promise.all([
    prisma.plate.count({ where: { userId, deletedAt: null } }),
    prisma.foodLog.findMany({
      where: { userId },
      select: { date: true },
      distinct: ['date'],
    }),
  ])

  const uniqueDiaryDays = diaryDays.length

  return (
    plateCount >= TRIAL_TRIGGER.minPlates ||
    uniqueDiaryDays >= TRIAL_TRIGGER.minDiaryDays
  )
}

// ─── Checkout ──────────────────────────────────────────────────────────────

interface CheckoutSessionInput {
  userId: string
  userEmail: string | undefined
  priceId: string
}

export interface CheckoutSessionResult {
  url: string
  sessionId: string
}

/**
 * Creates a Stripe Checkout session for a subscription.
 * Uses the existing stripeCustomerId if available.
 */
export async function createCheckoutSession(
  prisma: PrismaClient,
  input: CheckoutSessionInput,
): Promise<CheckoutSessionResult> {
  const stripe = getStripe()

  const successUrl =
    process.env['STRIPE_SUCCESS_URL'] ?? 'http://localhost:5173/billing/success'
  const cancelUrl =
    process.env['STRIPE_CANCEL_URL'] ?? 'http://localhost:5173/billing/cancel'

  // Look up existing subscription for stripeCustomerId
  const existingSub = await prisma.subscription.findUnique({
    where: { userId: input.userId },
    select: { stripeCustomerId: true },
  })

  const eligible = await isEligibleForTrial(prisma, input.userId)

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    line_items: [
      {
        price: input.priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId: input.userId,
    },
    subscription_data: {
      metadata: {
        userId: input.userId,
      },
      ...(eligible && { trial_period_days: TRIAL_TRIGGER.trialDays }),
    },
    currency: 'mxn',
    allow_promotion_codes: true,
  }

  // Attach customer if we already have one
  if (existingSub?.stripeCustomerId) {
    sessionParams.customer = existingSub.stripeCustomerId
  } else if (input.userEmail) {
    sessionParams.customer_email = input.userEmail
  }

  const session = await stripe.checkout.sessions.create(sessionParams)

  if (!session.url) {
    throw new AppError('No se pudo crear la sesión de pago', 500, 'STRIPE_ERROR')
  }

  return { url: session.url, sessionId: session.id }
}

// ─── Portal ────────────────────────────────────────────────────────────────

export interface PortalSessionResult {
  url: string
}

/**
 * Creates a Stripe Customer Portal session so the user can manage their subscription.
 */
export async function createPortalSession(customerId: string): Promise<PortalSessionResult> {
  const stripe = getStripe()

  const returnUrl =
    process.env['STRIPE_SUCCESS_URL']?.replace('/billing/success', '/profile') ??
    'http://localhost:5173/profile'

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return { url: session.url }
}

// ─── Subscription helpers ──────────────────────────────────────────────────

/**
 * Returns the current subscription for a user, or null if none exists.
 */
export async function getUserSubscription(prisma: PrismaClient, userId: string) {
  return prisma.subscription.findUnique({
    where: { userId },
    select: {
      id: true,
      status: true,
      interval: true,
      stripePriceId: true,
      stripeCustomerId: true,
      currentPeriodEnd: true,
      trialEnd: true,
      cancelAtPeriodEnd: true,
      canceledAt: true,
      createdAt: true,
    },
  })
}

// ─── Webhook handler ───────────────────────────────────────────────────────

/**
 * Verify and parse a Stripe webhook payload.
 * Returns the verified event or throws on invalid signature.
 */
export function constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
  const stripe = getStripe()
  const webhookSecret = process.env['STRIPE_WEBHOOK_SECRET']

  if (!webhookSecret) {
    throw new AppError('STRIPE_WEBHOOK_SECRET no configurado', 500, 'STRIPE_CONFIG_ERROR')
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Firma inválida'
    throw new AppError(`Webhook inválido: ${message}`, 400, 'WEBHOOK_SIGNATURE_INVALID')
  }
}

/**
 * Process a verified Stripe webhook event and sync the DB accordingly.
 */
export async function handleWebhookEvent(
  prisma: PrismaClient,
  event: Stripe.Event,
): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      await handleCheckoutCompleted(prisma, session)
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      await handleSubscriptionUpdated(prisma, subscription)
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      await handleSubscriptionDeleted(prisma, subscription)
      break
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice
      await handleInvoicePaid(prisma, invoice)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      await handleInvoicePaymentFailed(prisma, invoice)
      break
    }

    default:
      // Unhandled event type — log and ignore
      break
  }
}

// ─── Internal event handlers ───────────────────────────────────────────────

async function handleCheckoutCompleted(
  prisma: PrismaClient,
  session: Stripe.Checkout.Session,
): Promise<void> {
  const userId = session.metadata?.['userId']
  if (!userId) return

  const customerId =
    typeof session.customer === 'string' ? session.customer : session.customer?.id
  const subscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id

  if (!customerId || !subscriptionId) return

  // Fetch full subscription from Stripe to get price + period info
  const stripe = getStripe()
  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId)

  const firstItem = stripeSubscription.items.data[0]
  const priceId = firstItem?.price.id ?? null
  const status = mapStripeStatus(stripeSubscription.status)
  const interval = resolveInterval(stripeSubscription)
  // In Stripe v21, current_period_end is on SubscriptionItem, not Subscription
  const currentPeriodEnd = firstItem?.current_period_end
    ? new Date(firstItem.current_period_end * 1000)
    : null
  const trialEnd = stripeSubscription.trial_end
    ? new Date(stripeSubscription.trial_end * 1000)
    : null

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      stripeCustomerId: customerId,
      stripeSubId: subscriptionId,
      stripePriceId: priceId,
      status,
      interval,
      currentPeriodEnd,
      trialEnd,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    },
    update: {
      stripeCustomerId: customerId,
      stripeSubId: subscriptionId,
      stripePriceId: priceId,
      status,
      interval,
      currentPeriodEnd,
      trialEnd,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    },
  })
}

async function handleSubscriptionUpdated(
  prisma: PrismaClient,
  subscription: Stripe.Subscription,
): Promise<void> {
  const firstItem = subscription.items.data[0]
  const priceId = firstItem?.price.id ?? null
  const status = mapStripeStatus(subscription.status)
  const interval = resolveInterval(subscription)
  // In Stripe v21, current_period_end is on SubscriptionItem
  const currentPeriodEnd = firstItem?.current_period_end
    ? new Date(firstItem.current_period_end * 1000)
    : null
  const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null

  await prisma.subscription.updateMany({
    where: { stripeSubId: subscription.id },
    data: {
      status,
      interval,
      stripePriceId: priceId,
      currentPeriodEnd,
      trialEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
    },
  })
}

async function handleSubscriptionDeleted(
  prisma: PrismaClient,
  subscription: Stripe.Subscription,
): Promise<void> {
  await prisma.subscription.updateMany({
    where: { stripeSubId: subscription.id },
    data: {
      status: 'CANCELED',
      canceledAt: new Date(),
      cancelAtPeriodEnd: false,
    },
  })
}

async function handleInvoicePaid(prisma: PrismaClient, invoice: Stripe.Invoice): Promise<void> {
  // In Stripe v21, subscription is nested inside parent.subscription_details
  const subscriptionDetails = invoice.parent?.subscription_details
  const subscriptionId =
    subscriptionDetails?.subscription != null
      ? typeof subscriptionDetails.subscription === 'string'
        ? subscriptionDetails.subscription
        : subscriptionDetails.subscription.id
      : null

  if (!subscriptionId) return

  await prisma.subscription.updateMany({
    where: { stripeSubId: subscriptionId },
    data: { status: 'ACTIVE' },
  })
}

async function handleInvoicePaymentFailed(
  prisma: PrismaClient,
  invoice: Stripe.Invoice,
): Promise<void> {
  // In Stripe v21, subscription is nested inside parent.subscription_details
  const subscriptionDetails = invoice.parent?.subscription_details
  const subscriptionId =
    subscriptionDetails?.subscription != null
      ? typeof subscriptionDetails.subscription === 'string'
        ? subscriptionDetails.subscription
        : subscriptionDetails.subscription.id
      : null

  if (!subscriptionId) return

  // Set PAST_DUE — user keeps PRO access during grace period (3 days).
  // The tier resolution in auth.ts checks currentPeriodEnd + 3 days.
  await prisma.subscription.updateMany({
    where: { stripeSubId: subscriptionId },
    data: { status: 'PAST_DUE' },
  })
}

// ─── Helpers ───────────────────────────────────────────────────────────────

type DbSubscriptionStatus = 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED'

function mapStripeStatus(stripeStatus: Stripe.Subscription['status']): DbSubscriptionStatus {
  switch (stripeStatus) {
    case 'active':
      return 'ACTIVE'
    case 'trialing':
      return 'TRIALING'
    case 'past_due':
    case 'unpaid':
      return 'PAST_DUE'
    case 'canceled':
      return 'CANCELED'
    case 'incomplete':
    case 'incomplete_expired':
    case 'paused':
      return 'EXPIRED'
    default:
      return 'EXPIRED'
  }
}

function resolveInterval(subscription: Stripe.Subscription): 'MONTHLY' | 'YEARLY' {
  const interval = subscription.items.data[0]?.price.recurring?.interval
  return interval === 'year' ? 'YEARLY' : 'MONTHLY'
}
