/**
 * Subscription DTO — API response shape for subscription data.
 *
 * Mirrors the current API contract from REQ-BH-04:
 * all date fields are ISO strings, matching the Prisma DateTime serialization.
 */

export interface SubscriptionDto {
  id: string
  status: 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED'
  interval: 'MONTHLY' | 'YEARLY'
  stripePriceId: string | null
  stripeCustomerId: string | null
  currentPeriodEnd: string | null
  trialEnd: string | null
  cancelAtPeriodEnd: boolean
  canceledAt: string | null
  createdAt: string
}
