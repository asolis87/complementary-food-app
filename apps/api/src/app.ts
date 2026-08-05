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
import { ZodError } from 'zod'
import prismaPlugin from './shared/plugins/prisma.js'
import authPlugin from './shared/plugins/auth.js'
import originGuardPlugin from './shared/plugins/origin-guard.js'
import cacheControlPlugin from './shared/plugins/cache-control.js'
import httpRequestObservability from './shared/plugins/http-request-observability.js'
import { healthRoutes } from './modules/health/health.routes.js'
import { foodsRoutes } from './modules/foods/foods.routes.js'
import { platesRoutes } from './modules/plates/plates.routes.js'
import { snackRoutes } from './modules/snacks/snack.routes.js'
import { profilesRoutes } from './modules/profiles/profiles.routes.js'
import { diaryRoutes } from './modules/diary/diary.routes.js'
import { dayObservationRoutes } from './modules/diary/dayObservation.routes.js'
import { rangeRoutes } from './modules/diary/range.routes.js'
import { menusRoutes } from './modules/menus/menus.routes.js'
import { allergensRoutes } from './modules/allergens/allergens.routes.js'
import { billingRoutes } from './modules/billing/infrastructure/routes/billing.routes.js'
import { createBillingContainer } from './shared/infrastructure/di/billing.container.js'
import { authRoutes } from './modules/auth/auth.routes.js'
import { disclaimerRoutes } from './modules/disclaimer/disclaimer.routes.js'
import { dashboardRoutes } from './modules/dashboard/dashboard.routes.js'

/**
 * Audit M-04 (A05:2021): explicit trust-proxy policy.
 *
 * Behind a reverse proxy (Dokploy/Traefik), Fastify must opt in to trust
 * X-Forwarded-* headers — otherwise rate limiting and HTTPS detection rely
 * on spoofable values. Configured via TRUST_PROXY env var:
 *   - unset / "false" → false (safe default for direct exposure)
 *   - "true"          → true  (trust all hops; only for testing)
 *   - numeric ("1")   → trust that many hops in front
 *   - CSV / string    → list of trusted proxy IPs or CIDRs
 */
export function parseTrustProxy(value: string | undefined): boolean | number | string {
  if (!value || value === 'false') return false
  if (value === 'true') return true
  const asNumber = Number(value)
  if (Number.isInteger(asNumber) && asNumber > 0) return asNumber
  return value
}

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env['NODE_ENV'] === 'production' ? 'info' : 'debug',
    },
    trustProxy: parseTrustProxy(process.env['TRUST_PROXY']),
    // Privacy-safe observability emits its own structured request events;
    // disable Fastify's default request logs to avoid duplicate or leaky entries.
    disableRequestLogging: true,
  })

  // Note: No global custom content type parser here.
  // Fastify's built-in JSON parser handles all standard routes.
  // The Stripe webhook uses a scoped preParsing hook (in billing.routes.ts) to capture rawBody.
  // BetterAuth routes (auth.routes.ts) override the parser to leave the stream unconsumed.

  // === Privacy-safe HTTP request observability ===
  // Registered FIRST so its hooks wrap every other plugin (origin-guard 4xx, auth 401, etc.).
  await app.register(httpRequestObservability)

  // === Security Plugins ===
  // Audit H-04 (A05:2021): tightened CSP. The API serves JSON only, so
  // styleSrc/scriptSrc do not need 'unsafe-inline'. frame-ancestors blocks
  // clickjacking; form-action and base-uri prevent injection-driven redirects.
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        frameAncestors: ["'none'"],
        formAction: ["'self'"],
        baseUri: ["'self'"],
        objectSrc: ["'none'"],
      },
    },
  })

  await app.register(cors, {
    origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })

  // Audit H-01 (A01:2021): defense-in-depth CSRF guard via Origin/Referer
  // validation on state-changing methods. Must run after CORS so preflight
  // OPTIONS short-circuits first.
  await app.register(originGuardPlugin)

  // Audit M-05 (A05:2021): default no-store on private API responses to
  // prevent PWA / browser / proxy caches from storing personal data.
  await app.register(cacheControlPlugin)

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
  await app.register(snackRoutes, { prefix: '/api/snacks' })
  await app.register(profilesRoutes, { prefix: '/api/profiles' })
  await app.register(diaryRoutes, { prefix: '/api/diary' })
  await app.register(dayObservationRoutes, { prefix: '/api' })
  await app.register(rangeRoutes, { prefix: '/api/diary' })
  await app.register(menusRoutes, { prefix: '/api/menus' })
  await app.register(allergensRoutes, { prefix: '/api/allergens' })
  const billingContainer = createBillingContainer(app.prisma)
  await app.register(billingRoutes, { prefix: '/api/billing', controller: billingContainer.controller })
  await app.register(disclaimerRoutes, { prefix: '/api/disclaimer' })
  await app.register(dashboardRoutes, { prefix: '/api/dashboard' })

  // === Global Error Handler ===
  app.setErrorHandler<FastifyError>((error, _request, reply) => {
    if (error instanceof AppError) {
      const errorResponse: {
        code: string
        message: string
        details?: Record<string, unknown>
      } = {
        code: error.code,
        message: error.message,
      }

      // Include details for INSUFFICIENT_TIER error
      if (error.code === 'INSUFFICIENT_TIER') {
        const tierError = error as { required?: string; current?: string }
        errorResponse.details = {
          required: tierError.required ?? 'PRO',
          current: tierError.current ?? 'FREE',
        }
      }

      reply.status(error.statusCode).send({
        error: errorResponse,
      })
      return
    }

    // Zod validation errors (from schema.parse())
    if (error instanceof ZodError) {
      reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Datos inválidos',
          details: error.errors,
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
