/**
 * User-related types: tiers, profiles, auth.
 */

/** User subscription tier */
export type UserTier = 'FREE' | 'PRO'

/** Subscription status (from Prisma enum) */
export type SubscriptionStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED'

/** Baby profile */
export interface BabyProfile {
  id: string
  userId: string
  name: string
  birthDate: string // ISO date string
  acStartDate?: string // Alimentación complementaria start date
  notes?: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

/** User with tier info (for auth composable) */
export interface AuthUser {
  id: string
  email?: string
  name?: string
  tier: UserTier
  emailVerified?: boolean
  subscriptionStatus?: SubscriptionStatus | null
  trialEnd?: string | null // ISO date string
  createdAt: string
  /** Version string of the last accepted disclaimer, or null if never accepted. REQ-DC-06 */
  lastAcceptedDisclaimerVersion: string | null
}

