/**
 * SubscriptionRepository — hexagonal outbound port for subscription persistence.
 *
 * Decouples use cases from PrismaClient. Infrastructure adapter
 * (PrismaSubscriptionRepository) implements this contract.
 */

import type { Subscription } from '../entities/subscription.entity.js'
import type { SubscriptionStatus } from '../value-objects/subscription-status.vo.js'
import type { BillingInterval } from '../value-objects/subscription-status.vo.js'

export interface CreateSubscriptionData {
  userId: string
  status: SubscriptionStatus
  interval: BillingInterval
  stripeCustomerId?: string | null
  stripeSubId?: string | null
  stripePriceId?: string | null
  currentPeriodEnd?: Date | null
  trialEnd?: Date | null
  cancelAtPeriodEnd?: boolean
}

export interface SubscriptionRepository {
  findByUserId(userId: string): Promise<Subscription | null>
  findByStripeSubId(stripeSubId: string): Promise<Subscription | null>
  upsertByUserId(userId: string, data: CreateSubscriptionData): Promise<Subscription>
  updateByStripeSubId(stripeSubId: string, data: Partial<CreateSubscriptionData>): Promise<void>
}
