/**
 * StripePaymentGatewayAdapter — implements BillingPort using Stripe SDK v21.
 *
 * API version: 2026-03-25.dahlia
 *
 * SDK v21 breaking changes from v10:
 *   - Subscription.current_period_end → SubscriptionItem.current_period_end
 *   - Invoice.subscription → Invoice.parent.subscription_details.subscription
 */

import Stripe from 'stripe'
import { AppError } from '../../../../shared/errors/index.js'
import type {
  BillingPort,
  CheckoutInput,
  CheckoutSessionResult,
  PortalSessionResult,
  StripeSubscriptionDetails,
} from '../../domain/ports/billing.port.js'

export class StripePaymentGatewayAdapter implements BillingPort {
  private readonly stripe: Stripe
  private readonly webhookSecret: string

  constructor(secretKey: string, webhookSecret: string) {
    if (!secretKey) {
      throw new AppError('STRIPE_SECRET_KEY no configurado', 500, 'STRIPE_CONFIG_ERROR')
    }
    if (!webhookSecret) {
      throw new AppError('STRIPE_WEBHOOK_SECRET no configurado', 500, 'STRIPE_CONFIG_ERROR')
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2026-03-25.dahlia',
      typescript: true,
    })
    this.webhookSecret = webhookSecret
  }

  // ─── Checkout ──────────────────────────────────────────────────────────

  async createCheckoutSession(input: CheckoutInput): Promise<CheckoutSessionResult> {
    const successUrl =
      process.env['STRIPE_SUCCESS_URL'] ?? 'http://localhost:5173/billing/success'
    const cancelUrl =
      process.env['STRIPE_CANCEL_URL'] ?? 'http://localhost:5173/billing/cancel'

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
      },
      currency: 'mxn',
      allow_promotion_codes: true,
    }

    // Attach customer if we already have one
    if (input.stripeCustomerId) {
      sessionParams.customer = input.stripeCustomerId
    } else if (input.userEmail) {
      sessionParams.customer_email = input.userEmail
    }

    const session = await this.stripe.checkout.sessions.create(sessionParams)

    if (!session.url) {
      throw new AppError('No se pudo crear la sesión de pago', 500, 'STRIPE_ERROR')
    }

    return { url: session.url, sessionId: session.id }
  }

  // ─── Portal ────────────────────────────────────────────────────────────

  async createPortalSession(customerId: string): Promise<PortalSessionResult> {
    const returnUrl =
      process.env['STRIPE_SUCCESS_URL']?.replace('/billing/success', '/profile') ??
      'http://localhost:5173/profile'

    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })

    return { url: session.url }
  }

  // ─── Webhook ───────────────────────────────────────────────────────────

  constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
    try {
      return this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Firma inválida'
      throw new AppError(`Webhook inválido: ${message}`, 400, 'WEBHOOK_SIGNATURE_INVALID')
    }
  }

  // ─── Subscription retrieval ────────────────────────────────────────────

  async retrieveSubscription(stripeSubId: string): Promise<StripeSubscriptionDetails> {
    const subscription = await this.stripe.subscriptions.retrieve(stripeSubId)

    // SDK v21: current_period_end is on SubscriptionItem
    const firstItem = subscription.items.data[0]
    const priceId = firstItem?.price.id ?? null
    const currentPeriodEnd = firstItem?.current_period_end
      ? new Date(firstItem.current_period_end * 1000)
      : null
    const trialEnd = subscription.trial_end
      ? new Date(subscription.trial_end * 1000)
      : null

    return {
      stripeSubId: subscription.id,
      stripePriceId: priceId,
      status: this.mapStripeStatus(subscription.status),
      interval: this.resolveInterval(subscription),
      currentPeriodEnd,
      trialEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000)
        : null,
    }
  }

  // ─── Private helpers ───────────────────────────────────────────────────

  private mapStripeStatus(
    status: Stripe.Subscription['status'],
  ): StripeSubscriptionDetails['status'] {
    switch (status) {
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

  private resolveInterval(
    subscription: Stripe.Subscription,
  ): 'MONTHLY' | 'YEARLY' {
    const interval = subscription.items.data[0]?.price.recurring?.interval
    return interval === 'year' ? 'YEARLY' : 'MONTHLY'
  }
}
