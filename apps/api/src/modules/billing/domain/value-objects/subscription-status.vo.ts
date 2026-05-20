/**
 * SubscriptionStatus value object.
 *
 * Centralizes the status type and provides helper predicates to avoid
 * duplicating `status === 'ACTIVE' || status === 'TRIALING'` checks
 * across use cases.
 */

export type SubscriptionStatus = 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED'

export type BillingInterval = 'MONTHLY' | 'YEARLY'

/**
 * Returns true when the subscription grants PRO access.
 * ACTIVE and TRIALING both count as "active" for tier resolution.
 */
export function isActive(status: SubscriptionStatus): boolean {
  return status === 'ACTIVE' || status === 'TRIALING'
}
