/**
 * StartTrialUseCase — creates a local trial subscription (no Stripe).
 *
 * Spec: REQ-BH-05
 * Design: AD5 — trial-first model.
 *
 * Extracted from billing.service.ts lines 149-206.
 * Uses SubscriptionRepository port instead of raw PrismaClient.
 */

import { TRIAL_DURATION_DAYS } from '@pakulab/shared'
import type { SubscriptionRepository } from '../../domain/ports/subscription.repository.js'
import type { Subscription } from '../../domain/entities/subscription.entity.js'
import { DuplicateSubscriptionException } from '../../domain/exceptions/duplicate-subscription.exception.js'
import type { StartTrialDto } from '../dtos/trial.dto.js'

export class StartTrialUseCase {
  constructor(private readonly subscriptionRepo: SubscriptionRepository) {}

  async execute(dto: StartTrialDto): Promise<Subscription> {
    const { userId, plan } = dto

    // Check for existing ACTIVE or TRIALING subscription
    const existing = await this.subscriptionRepo.findByUserId(userId)

    if (existing && (existing.status === 'ACTIVE' || existing.status === 'TRIALING')) {
      throw new DuplicateSubscriptionException()
    }

    // Calculate interval from plan
    const interval = plan === 'PRO_YEARLY' ? 'YEARLY' : 'MONTHLY'

    // Calculate trial end (21 days from now)
    const trialEnd = new Date(Date.now() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000)
    const currentPeriodEnd = trialEnd

    // Create or update subscription
    return this.subscriptionRepo.upsertByUserId(userId, {
      userId,
      status: 'TRIALING',
      interval,
      trialEnd,
      currentPeriodEnd,
      stripeCustomerId: null,
      stripeSubId: null,
      stripePriceId: null,
      cancelAtPeriodEnd: false,
    })
  }
}
