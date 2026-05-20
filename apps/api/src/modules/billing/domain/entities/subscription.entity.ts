/**
 * Subscription domain entity.
 *
 * Represents a user's subscription in the domain layer — decoupled from
 * the Prisma persistence model. All date fields are Date objects, not
 * Prisma DateTime strings.
 */

export interface Subscription {
  id: string
  userId: string
  status: SubscriptionStatus
  interval: BillingInterval
  stripeCustomerId: string | null
  stripeSubId: string | null
  stripePriceId: string | null
  currentPeriodEnd: Date | null
  trialEnd: Date | null
  cancelAtPeriodEnd: boolean
  canceledAt: Date | null
  createdAt: Date
}

export type SubscriptionStatus = 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED'

export type BillingInterval = 'MONTHLY' | 'YEARLY'
