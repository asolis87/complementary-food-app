/**
 * CreatePortalUseCase — opens a Stripe Customer Portal session.
 *
 * Spec: REQ-BH-02
 *
 * Extracted from billing.service.ts lines 112-125.
 */

import type { BillingPort, PortalSessionResult } from '../../domain/ports/billing.port.js'
import type { SubscriptionRepository } from '../../domain/ports/subscription.repository.js'
import { MissingStripeCustomerException } from '../../domain/exceptions/missing-stripe-customer.exception.js'

export class CreatePortalUseCase {
  constructor(
    private readonly billingPort: BillingPort,
    private readonly subscriptionRepo: SubscriptionRepository,
  ) {}

  async execute(userId: string): Promise<PortalSessionResult> {
    const sub = await this.subscriptionRepo.findByUserId(userId)

    if (!sub?.stripeCustomerId) {
      throw new MissingStripeCustomerException()
    }

    return this.billingPort.createPortalSession(sub.stripeCustomerId)
  }
}
