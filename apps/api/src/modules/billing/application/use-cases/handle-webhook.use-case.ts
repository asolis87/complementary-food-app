/**
 * HandleWebhookUseCase — processes verified Stripe webhook events.
 *
 * Spec: REQ-BH-03 (all 9 webhook scenarios)
 *
 * Extracted from billing.service.ts lines 208-359.
 * Maps 5 Stripe event types to internal handlers that sync the DB.
 *
 * Uses BillingPort for signature verification and Stripe API calls,
 * SubscriptionRepository for DB operations.
 */

import type Stripe from 'stripe'
import type { BillingPort } from '../../domain/ports/billing.port.js'
import type { SubscriptionRepository } from '../../domain/ports/subscription.repository.js'

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

  // ─── Event router ──────────────────────────────────────────────────────

  private async routeEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await this.handleCheckoutCompleted(session)
        break
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await this.handleSubscriptionUpdated(subscription)
        break
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await this.handleSubscriptionDeleted(subscription)
        break
      }
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        await this.handleInvoicePaid(invoice)
        break
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await this.handleInvoicePaymentFailed(invoice)
        break
      }
      default:
        // Unhandled event type — log and ignore
        break
    }
  }

  // ─── Internal event handlers ───────────────────────────────────────────

  private async handleCheckoutCompleted(
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

    // Fetch full subscription details from Stripe via port
    const details = await this.billingPort.retrieveSubscription(subscriptionId)

    await this.subscriptionRepo.upsertByUserId(userId, {
      userId,
      status: details.status,
      interval: details.interval,
      stripeCustomerId: customerId,
      stripeSubId: subscriptionId,
      stripePriceId: details.stripePriceId,
      currentPeriodEnd: details.currentPeriodEnd,
      trialEnd: details.trialEnd,
      cancelAtPeriodEnd: details.cancelAtPeriodEnd,
    })
  }

  private async handleSubscriptionUpdated(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    // SDK v21: current_period_end is on SubscriptionItem
    const firstItem = subscription.items.data[0]
    const priceId = firstItem?.price.id ?? null
    const currentPeriodEnd = firstItem?.current_period_end
      ? new Date(firstItem.current_period_end * 1000)
      : null
    const trialEnd = subscription.trial_end
      ? new Date(subscription.trial_end * 1000)
      : null

    await this.subscriptionRepo.updateByStripeSubId(subscription.id, {
      status: mapStripeStatus(subscription.status),
      interval: resolveInterval(subscription),
      stripePriceId: priceId,
      currentPeriodEnd,
      trialEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    })
  }

  private async handleSubscriptionDeleted(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    await this.subscriptionRepo.updateByStripeSubId(subscription.id, {
      status: 'CANCELED',
      cancelAtPeriodEnd: false,
    })
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    // SDK v21: subscription is nested inside parent.subscription_details
    const subDetails = invoice.parent?.subscription_details
    const subscriptionId =
      subDetails?.subscription != null
        ? typeof subDetails.subscription === 'string'
          ? subDetails.subscription
          : (subDetails.subscription as { id: string }).id
        : null

    if (!subscriptionId) return

    await this.subscriptionRepo.updateByStripeSubId(subscriptionId, {
      status: 'ACTIVE',
    })
  }

  private async handleInvoicePaymentFailed(
    invoice: Stripe.Invoice,
  ): Promise<void> {
    // SDK v21: subscription is nested inside parent.subscription_details
    const subDetails = invoice.parent?.subscription_details
    const subscriptionId =
      subDetails?.subscription != null
        ? typeof subDetails.subscription === 'string'
          ? subDetails.subscription
          : (subDetails.subscription as { id: string }).id
        : null

    if (!subscriptionId) return

    // Set PAST_DUE — user keeps PRO access during grace period (3 days).
    // The tier resolution in auth.ts checks currentPeriodEnd + 3 days.
    await this.subscriptionRepo.updateByStripeSubId(subscriptionId, {
      status: 'PAST_DUE',
    })
  }
}

// ─── Helpers (private) ───────────────────────────────────────────────────

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
