/**
 * Billing / Stripe routes.
 * Spec: REQ-PAY-01, REQ-PAY-02
 *
 * Routes:
 *   POST /api/billing/create-checkout — create Stripe Checkout session (requires auth, FREE+)
 *   POST /api/billing/create-portal  — create Stripe Portal session (requires auth)
 *   POST /api/billing/webhook        — Stripe webhook (NO auth, raw body)
 *   GET  /api/billing/subscription   — get current subscription status (requires auth)
 *   POST /api/billing/start-trial    — start local trial subscription (requires auth)
 *
 * RAW BODY FOR STRIPE WEBHOOK:
 *   We use a scoped `preParsing` hook that fires only for this plugin's routes.
 *   It reads the entire IncomingMessage stream into a Buffer, stores it in `request.rawBody`,
 *   and then re-emits the data through the stream so Fastify's JSON parser can still run.
 *   This avoids the global `parseAs: 'buffer'` content type parser that broke BetterAuth.
 */

import { Readable } from 'node:stream'
import type { FastifyPluginAsync } from 'fastify'
import { requireAuth } from '../../../../shared/hooks/requireAuth.js'
import { requireTier } from '../../../../shared/hooks/requireTier.js'
import type { BillingController } from '../controllers/billing.controller.js'

export interface BillingRoutesOptions {
  controller: BillingController
}

export const billingRoutes: FastifyPluginAsync<BillingRoutesOptions> = async (fastify, opts) => {
  const controller = opts.controller

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
   */
  fastify.post(
    '/create-checkout',
    { preHandler: [requireAuth, requireTier('FREE')] },
    async (request, reply) => {
      await controller.createCheckout(request, reply)
    },
  )

  /**
   * POST /api/billing/create-portal
   */
  fastify.post('/create-portal', { preHandler: [requireAuth] }, async (request, reply) => {
    await controller.createPortal(request, reply)
  })

  /**
   * POST /api/billing/webhook
   * CRITICAL: No auth middleware. Must receive raw body for signature verification.
   */
  fastify.post('/webhook', {}, async (request, reply) => {
    await controller.handleWebhook(request, reply)
  })

  /**
   * GET /api/billing/subscription
   */
  fastify.get('/subscription', { preHandler: [requireAuth] }, async (request, reply) => {
    await controller.getSubscription(request, reply)
  })

  /**
   * POST /api/billing/start-trial
   */
  fastify.post('/start-trial', { preHandler: [requireAuth] }, async (request, reply) => {
    await controller.startTrial(request, reply)
  })
}
