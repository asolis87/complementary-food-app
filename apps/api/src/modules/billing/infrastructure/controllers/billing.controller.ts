/**
 * BillingController — HTTP layer for billing endpoints.
 *
 * Thin controller: extracts data from HTTP request, delegates to use cases,
 * formats the response. No business logic here.
 *
 * Spec: REQ-BH-01 through REQ-BH-06
 */

import type { FastifyRequest, FastifyReply } from 'fastify'
import type { CreateCheckoutUseCase } from '../../application/use-cases/create-checkout.use-case.js'
import type { CreatePortalUseCase } from '../../application/use-cases/create-portal.use-case.js'
import type { HandleWebhookUseCase } from '../../application/use-cases/handle-webhook.use-case.js'
import type { GetSubscriptionUseCase } from '../../application/use-cases/get-subscription.use-case.js'
import type { StartTrialUseCase } from '../../application/use-cases/start-trial.use-case.js'
import type { DeleteUserAccountUseCase } from '../../application/use-cases/delete-user-account.use-case.js'
import { createCheckoutSchema, startTrialSchema } from '../schemas/billing.schema.js'
import { AppError } from '../../../../shared/errors/index.js'
import type { TrialPlan } from '../../application/dtos/trial.dto.js'

export class BillingController {
  constructor(
    private readonly createCheckoutUC: CreateCheckoutUseCase,
    private readonly createPortalUC: CreatePortalUseCase,
    private readonly handleWebhookUC: HandleWebhookUseCase,
    private readonly getSubscriptionUC: GetSubscriptionUseCase,
    private readonly startTrialUC: StartTrialUseCase,
    private readonly deleteUserAccountUC: DeleteUserAccountUseCase,
  ) {}

  // ─── POST /api/billing/create-checkout ─────────────────────────────────

  async createCheckout(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const input = createCheckoutSchema.parse(request.body)
    const user = request.user!

    const result = await this.createCheckoutUC.execute({
      userId: user.id,
      userEmail: user.email,
      priceId: input.priceId,
    })

    reply.send({ data: result })
  }

  // ─── POST /api/billing/create-portal ───────────────────────────────────

  async createPortal(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const user = request.user!

    const result = await this.createPortalUC.execute(user.id)
    reply.send({ data: result })
  }

  // ─── POST /api/billing/webhook ─────────────────────────────────────────

  async handleWebhook(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const signature = request.headers['stripe-signature']

    if (!signature || typeof signature !== 'string') {
      throw new AppError('Firma Stripe ausente', 400, 'MISSING_STRIPE_SIGNATURE')
    }

    const rawBody = (request as { rawBody?: Buffer }).rawBody
    if (!rawBody) {
      throw new AppError('Raw body no disponible', 500, 'RAW_BODY_MISSING')
    }

    await this.handleWebhookUC.execute({ payload: rawBody, signature })

    reply.send({ received: true })
  }

  // ─── GET /api/billing/subscription ─────────────────────────────────────

  async getSubscription(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const sub = await this.getSubscriptionUC.execute(request.user!.id)
    reply.send({ data: sub })
  }

  // ─── POST /api/billing/start-trial ─────────────────────────────────────

  async startTrial(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const input = startTrialSchema.parse(request.body)
    const user = request.user!

    const subscription = await this.startTrialUC.execute({
      userId: user.id,
      plan: input.plan as TrialPlan,
    })

    reply.code(201).send({ data: subscription })
  }

  // ─── DELETE /api/profiles/me (account deletion) ────────────────────────

  async deleteAccount(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    await this.deleteUserAccountUC.execute(request.user!.id)
    reply.send({ data: null })
  }
}
