/**
 * GetSubscriptionUseCase — retrieves the current subscription for a user.
 *
 * Spec: REQ-BH-04
 *
 * Extracted from billing.service.ts lines 131-143.
 * Maps the domain Subscription entity to a SubscriptionDto with ISO date strings.
 */

import type { SubscriptionRepository } from '../../domain/ports/subscription.repository.js'
import type { SubscriptionDto } from '../dtos/subscription.dto.js'

export class GetSubscriptionUseCase {
  constructor(private readonly subscriptionRepo: SubscriptionRepository) {}

  async execute(userId: string): Promise<SubscriptionDto | null> {
    const sub = await this.subscriptionRepo.findByUserId(userId)

    if (!sub) return null

    return {
      id: sub.id,
      status: sub.status,
      interval: sub.interval,
      stripePriceId: sub.stripePriceId,
      stripeCustomerId: sub.stripeCustomerId,
      currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
      trialEnd: sub.trialEnd?.toISOString() ?? null,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      canceledAt: sub.canceledAt?.toISOString() ?? null,
      createdAt: sub.createdAt.toISOString(),
    }
  }
}
