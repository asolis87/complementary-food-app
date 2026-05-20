/**
 * CreateCheckoutUseCase — creates a Stripe Checkout session.
 *
 * Spec: REQ-BH-01
 * Design: AD5 — Free → Pro flow via Stripe Checkout.
 *
 * Extracted from billing.service.ts lines 48-109.
 * Uses BillingPort (abstraction over Stripe SDK) and SubscriptionRepository.
 */

import type { BillingPort, CheckoutSessionResult } from '../../domain/ports/billing.port.js'
import type { SubscriptionRepository } from '../../domain/ports/subscription.repository.js'
import type { CreateCheckoutDto } from '../dtos/checkout.dto.js'

export class CreateCheckoutUseCase {
  constructor(
    private readonly billingPort: BillingPort,
    private readonly subscriptionRepo: SubscriptionRepository,
  ) {}

  async execute(dto: CreateCheckoutDto): Promise<CheckoutSessionResult> {
    // Look up existing subscription for stripeCustomerId
    const existingSub = await this.subscriptionRepo.findByUserId(dto.userId)

    return this.billingPort.createCheckoutSession({
      userId: dto.userId,
      userEmail: dto.userEmail,
      priceId: dto.priceId,
      stripeCustomerId: existingSub?.stripeCustomerId,
    })
  }
}
