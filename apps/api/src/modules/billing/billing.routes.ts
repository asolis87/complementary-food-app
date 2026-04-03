/**
 * Billing / Stripe routes.
 * Spec: REQ-PAY-01, REQ-PAY-02
 *
 * Routes:
 *   POST /api/billing/create-checkout — create Stripe Checkout session (requires auth, FREE+)
 *   POST /api/billing/create-portal  — create Stripe Portal session (requires auth, PRO)
 *   POST /api/billing/webhook        — Stripe webhook (NO auth, raw body)
 *   GET  /api/billing/subscription   — get current subscription status (requires auth)
 *
 * RAW BODY FOR STRIPE WEBHOOK:
 *   We use a scoped `preParsing` hook that fires only for this plugin's routes.
 *   It reads the entire IncomingMessage stream into a Buffer, stores it in `request.rawBody`,
 *   and then re-emits the data through the stream so Fastify's JSON parser can still run.
 *   This avoids the global `parseAs: 'buffer'` content type parser that broke BetterAuth.
 */

import { Readable } from 'node:stream'
import type { FastifyPluginAsync } from 'fastify'
import { requireAuth } from '../../shared/hooks/requireAuth.js'
import { requireTier } from '../../shared/hooks/requireTier.js'
import { AppError, NotFoundError } from '../../shared/errors/index.js'
import { createCheckoutSchema } from './billing.schema.js'
import {
  createCheckoutSession,
  createPortalSession,
  constructWebhookEvent,
  handleWebhookEvent,
  getUserSubscription,
} from './billing.service.js'

export const billingRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * preParsing hook — scoped to this plugin (all /api/billing/* routes).
   * Reads the raw stream into a Buffer, attaches it as request.rawBody,
   * then wraps it in a new Readable and passes it back so Fastify can still parse JSON.
   */
  fastify.addHook('preParsing', async (request, _reply, payload) => {
    const chunks: Buffer[] = []
    for await (const chunk of payload) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string))
    }
    const rawBuffer = Buffer.concat(chunks)
    ;(request as { rawBody?: Buffer }).rawBody = rawBuffer

    // Return a new Readable so Fastify's content type parser can still consume it
    const readable = new Readable()
    readable.push(rawBuffer)
    readable.push(null)
    return readable
  })

  /**
   * POST /api/billing/create-checkout
   * Creates a Stripe Checkout session and returns the redirect URL.
   * Requires an authenticated FREE+ user (not anonymous).
   */
  fastify.post(
    '/create-checkout',
    { preHandler: [requireAuth, requireTier('FREE')] },
    async (request, reply) => {
      const input = createCheckoutSchema.parse(request.body)
      const user = request.user!

      const result = await createCheckoutSession(fastify.prisma, {
        userId: user.id,
        userEmail: user.email,
        priceId: input.priceId,
      })

      reply.send({ data: result })
    },
  )

  /**
   * POST /api/billing/create-portal
   * Returns a Stripe Customer Portal URL so the user can manage their subscription.
   * Requires PRO tier (only subscribers have a stripeCustomerId).
   */
  fastify.post('/create-portal', { preHandler: [requireAuth] }, async (request, reply) => {
    const user = request.user!

    const sub = await fastify.prisma.subscription.findUnique({
      where: { userId: user.id },
      select: { stripeCustomerId: true },
    })

    if (!sub?.stripeCustomerId) {
      throw new NotFoundError('Suscripción de Stripe')
    }

    const result = await createPortalSession(sub.stripeCustomerId)
    reply.send({ data: result })
  })

  /**
   * POST /api/billing/webhook
   * Stripe sends signed webhook events here.
   * CRITICAL: No auth middleware. Must receive raw body for signature verification.
   * rawBody is captured by the preParsing hook above (scoped to this plugin).
   */
  fastify.post(
    '/webhook',
    {},
    async (request, reply) => {
      const signature = request.headers['stripe-signature']

      if (!signature || typeof signature !== 'string') {
        throw new AppError('Firma Stripe ausente', 400, 'MISSING_STRIPE_SIGNATURE')
      }

      // raw body buffer
      const rawBody = (request as { rawBody?: Buffer }).rawBody
      if (!rawBody) {
        throw new AppError('Raw body no disponible', 500, 'RAW_BODY_MISSING')
      }

      const event = constructWebhookEvent(rawBody, signature)
      await handleWebhookEvent(fastify.prisma, event)

      reply.send({ received: true })
    },
  )

  /**
   * GET /api/billing/subscription
   * Returns the current subscription record for the authenticated user.
   */
  fastify.get('/subscription', { preHandler: [requireAuth] }, async (request, reply) => {
    const sub = await getUserSubscription(fastify.prisma, request.user!.id)
    reply.send({ data: sub ?? null })
  })
}
