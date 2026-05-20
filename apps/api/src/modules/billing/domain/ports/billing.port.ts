/**
 * BillingPort — hexagonal outbound port for payment gateway operations.
 *
 * This port abstracts Stripe SDK operations so the application layer
 * never imports 'stripe' directly. The infrastructure adapter
 * (StripePaymentGatewayAdapter) implements this contract.
 *
 * NOTE: CheckoutSessionResult and PortalSessionResult are defined here
 * (not in DTOs) to keep the domain layer free of application-layer imports.
 * Application DTOs re-export or extend these types as needed.
 */

export interface CheckoutSessionResult {
  url: string
  sessionId: string
}

export interface PortalSessionResult {
  url: string
}

export interface CheckoutInput {
  userId: string
  userEmail?: string
  priceId: string
  stripeCustomerId?: string | null
}

export interface StripeSubscriptionDetails {
  stripeSubId: string
  stripePriceId: string | null
  status: StripeSubscriptionStatus
  interval: 'MONTHLY' | 'YEARLY'
  currentPeriodEnd: Date | null
  trialEnd: Date | null
  cancelAtPeriodEnd: boolean
  canceledAt: Date | null
}

export type StripeSubscriptionStatus =
  | 'ACTIVE'
  | 'TRIALING'
  | 'PAST_DUE'
  | 'CANCELED'
  | 'EXPIRED'

export interface BillingPort {
  createCheckoutSession(input: CheckoutInput): Promise<CheckoutSessionResult>
  createPortalSession(customerId: string): Promise<PortalSessionResult>
  constructWebhookEvent(payload: Buffer, signature: string): import('stripe').Stripe.Event
  retrieveSubscription(stripeSubId: string): Promise<StripeSubscriptionDetails>
}
