/**
 * Fastify application factory.
 * Registers all plugins and modules via screaming architecture pattern.
 *
 * Design Decision AD2: Screaming architecture — modules by domain.
 * Design Decision AD3: Shared DB, no inter-module API calls.
 */

import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import Fastify, { type FastifyError } from 'fastify'
import './shared/types.js'
import { AppError } from './shared/errors/index.js'
import prismaPlugin from './shared/plugins/prisma.js'
import authPlugin from './shared/plugins/auth.js'
import { healthRoutes } from './modules/health/health.routes.js'
import { foodsRoutes } from './modules/foods/foods.routes.js'
import { platesRoutes } from './modules/plates/plates.routes.js'
import { profilesRoutes } from './modules/profiles/profiles.routes.js'
import { diaryRoutes } from './modules/diary/diary.routes.js'
import { menusRoutes } from './modules/menus/menus.routes.js'
import { allergensRoutes } from './modules/allergens/allergens.routes.js'
import { billingRoutes } from './modules/billing/billing.routes.js'
import { authRoutes } from './modules/auth/auth.routes.js'

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env['NODE_ENV'] === 'production' ? 'info' : 'debug',
    },
  })

  // === Raw body support for Stripe webhook signature verification ===
  // Must be registered BEFORE any body-parsing plugins.
  // Stores raw Buffer on request.rawBody so the webhook route can verify signatures.
  app.addContentTypeParser(
    'application/json',
    { parseAs: 'buffer' },
    (req, body, done) => {
      try {
        // Attach raw buffer for routes that need it (e.g. Stripe webhook)
        ;(req as { rawBody?: Buffer }).rawBody = body as Buffer
        const json: unknown = JSON.parse((body as Buffer).toString())
        done(null, json)
      } catch (err) {
        done(err as Error, undefined)
      }
    },
  )

  // === Security Plugins ===
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
      },
    },
  })

  await app.register(cors, {
    origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })

  await app.register(rateLimit, {
    global: true,
    max: 100, // 100 req/min for anonymous
    timeWindow: '1 minute',
    // Per-route overrides are set in each module's routes file
  })

  // === Database Plugin ===
  await app.register(prismaPlugin)

  // === Auth Session Extractor (must run after prisma) ===
  await app.register(authPlugin)

  // === Module Routes ===
  await app.register(healthRoutes)
  await app.register(authRoutes, { prefix: '/api/auth' })
  await app.register(foodsRoutes, { prefix: '/api/foods' })
  await app.register(platesRoutes, { prefix: '/api/plates' })
  await app.register(profilesRoutes, { prefix: '/api/profiles' })
  await app.register(diaryRoutes, { prefix: '/api/diary' })
  await app.register(menusRoutes, { prefix: '/api/menus' })
  await app.register(allergensRoutes, { prefix: '/api/allergens' })
  await app.register(billingRoutes, { prefix: '/api/billing' })

  // === Global Error Handler ===
  app.setErrorHandler<FastifyError>((error, _request, reply) => {
    if (error instanceof AppError) {
      reply.status(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
        },
      })
      return
    }

    // Fastify validation errors
    if (error.validation) {
      reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Datos inválidos',
          details: error.validation,
        },
      })
      return
    }

    // Unexpected errors — don't leak details in production
    app.log.error(error)
    reply.status(500).send({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error interno del servidor',
      },
    })
  })

  return app
}
