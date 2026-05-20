/**
 * Billing DI container — wires all billing adapters, use cases, and controller.
 *
 * This factory creates the complete billing dependency graph.
 * Used by:
 *   - app.ts → registers billing routes with the controller
 *   - billing/index.ts → barrel exports for backward compat
 */

import type { PrismaClient } from '@prisma/client'
import { StripePaymentGatewayAdapter } from '../../../modules/billing/infrastructure/adapters/stripe-payment-gateway.adapter.js'
import { PrismaSubscriptionRepository } from '../../../modules/billing/infrastructure/adapters/prisma-subscription.repository.js'
import { PrismaUserAccountAdapter } from '../../../modules/billing/infrastructure/adapters/prisma-user-account.adapter.js'
import { CreateCheckoutUseCase } from '../../../modules/billing/application/use-cases/create-checkout.use-case.js'
import { CreatePortalUseCase } from '../../../modules/billing/application/use-cases/create-portal.use-case.js'
import { HandleWebhookUseCase } from '../../../modules/billing/application/use-cases/handle-webhook.use-case.js'
import { GetSubscriptionUseCase } from '../../../modules/billing/application/use-cases/get-subscription.use-case.js'
import { StartTrialUseCase } from '../../../modules/billing/application/use-cases/start-trial.use-case.js'
import { DeleteUserAccountUseCase } from '../../../modules/billing/application/use-cases/delete-user-account.use-case.js'
import { BillingController } from '../../../modules/billing/infrastructure/controllers/billing.controller.js'
import { AppError } from '../../errors/index.js'

export interface BillingContainer {
  controller: BillingController
  createTrialSubscription: (input: { userId: string; plan: 'TRIAL' | 'PRO_MONTHLY' | 'PRO_YEARLY' }) => ReturnType<StartTrialUseCase['execute']>
  deleteUserAccount: (userId: string) => Promise<void>
}

export function createBillingContainer(prisma: PrismaClient): BillingContainer {
  const secretKey = process.env['STRIPE_SECRET_KEY']
  const webhookSecret = process.env['STRIPE_WEBHOOK_SECRET']

  if (!secretKey) {
    throw new AppError('STRIPE_SECRET_KEY no configurado', 500, 'STRIPE_CONFIG_ERROR')
  }
  if (!webhookSecret) {
    throw new AppError('STRIPE_WEBHOOK_SECRET no configurado', 500, 'STRIPE_CONFIG_ERROR')
  }

  // Adapters (infrastructure)
  const stripeAdapter = new StripePaymentGatewayAdapter(secretKey, webhookSecret)
  const subscriptionRepo = new PrismaSubscriptionRepository(prisma)
  const userAccountAdapter = new PrismaUserAccountAdapter(prisma)

  // Use Cases (application)
  const createCheckoutUC = new CreateCheckoutUseCase(stripeAdapter, subscriptionRepo)
  const createPortalUC = new CreatePortalUseCase(stripeAdapter, subscriptionRepo)
  const handleWebhookUC = new HandleWebhookUseCase(stripeAdapter, subscriptionRepo)
  const getSubscriptionUC = new GetSubscriptionUseCase(subscriptionRepo)
  const startTrialUC = new StartTrialUseCase(subscriptionRepo)
  const deleteUserAccountUC = new DeleteUserAccountUseCase(userAccountAdapter)

  // Controller (infrastructure)
  const controller = new BillingController(
    createCheckoutUC,
    createPortalUC,
    handleWebhookUC,
    getSubscriptionUC,
    startTrialUC,
    deleteUserAccountUC,
  )

  return {
    controller,
    createTrialSubscription: (input) => startTrialUC.execute(input),
    deleteUserAccount: (userId) => deleteUserAccountUC.execute(userId),
  }
}
