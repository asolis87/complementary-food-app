/**
 * Fastify plugin: privacy-safe HTTP request observability.
 *
 * Emits one structured log event per completed request at the API system
 * boundary. The event is whitelisted to a fixed field shape and never
 * contains bodies, headers, query strings, parameter values, or any PII.
 *
 * Lifecycle: `onRequest` stamps the monotonic start; `onResponse` reads
 * the final status, builds the whitelisted event and dispatches to the
 * matching severity bucket. Never emits in `onError` to avoid duplicate
 * completion events. The hook is non-throwing: logging failures are
 * swallowed so observability never breaks the request pipeline.
 */

import { randomUUID } from 'node:crypto'
import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

export type HttpSeverity = 'info' | 'warn' | 'error'

export interface HttpRequestEvent {
  method: string
  url: string
  status: number
  durationMs: number
  severity: HttpSeverity
  user?: string
  timestamp: string
  requestId: string
}

export interface HttpRequestEventInput {
  method: string
  url: string
  status: number
  durationMs: number
  severity: HttpSeverity
  user?: string
  requestId: string
  timestamp: string
}

// Whitelist of technical-health route patterns. Successful (2xx) responses
// on any of these routes are suppressed. Failed (4xx/5xx) responses still
// emit an event using ordinary status-derived severity.
const TECHNICAL_HEALTH_ROUTES = new Set<string>([
  '/health', '/ready', '/live',
  '/api/health', '/api/ready', '/api/live',
  '/api/health/email',
])

const UNKNOWN_ROUTE_PATTERN = '/__unknown'

export function classifySeverity(status: number): HttpSeverity {
  if (status >= 500) return 'error'
  if (status >= 400) return 'warn'
  return 'info'
}

export function isTechnicalHealthRoute(routePattern: string): boolean {
  return TECHNICAL_HEALTH_ROUTES.has(routePattern)
}

export function resolveRoutePattern(routeOptionsUrl: string | undefined): string {
  if (typeof routeOptionsUrl === 'string' && routeOptionsUrl.length > 0) {
    return routeOptionsUrl
  }
  return UNKNOWN_ROUTE_PATTERN
}

export function buildHttpRequestEvent(input: HttpRequestEventInput): HttpRequestEvent {
  // Build the event with only the whitelisted keys. The user field is
  // intentionally omitted when no authenticated session is present.
  const event: HttpRequestEvent = {
    method: input.method,
    url: input.url,
    status: input.status,
    durationMs: input.durationMs,
    severity: input.severity,
    requestId: input.requestId,
    timestamp: input.timestamp,
  }
  if (input.user !== undefined) event.user = input.user
  return event
}

// Per-request start time, stored off the request object so we never pollute
// the public Fastify request surface.
const START_TIME = Symbol.for('__httpRequestObservabilityStart')
interface RequestWithStart { [START_TIME]?: bigint }

const observabilityPlugin: FastifyPluginAsync = async (fastify) => {
  // Fallback request id in case Fastify has not assigned one yet.
  const fallbackId = randomUUID()

  fastify.addHook('onRequest', (request, _reply, done) => {
    ;(request as unknown as RequestWithStart)[START_TIME] = process.hrtime.bigint()
    done()
  })

  fastify.addHook('onResponse', (request, reply, done) => {
    try {
      const start = (request as unknown as RequestWithStart)[START_TIME]
      const durationMs =
        start !== undefined ? Number(process.hrtime.bigint() - start) / 1_000_000 : 0
      const url = resolveRoutePattern(request.routeOptions.url)
      const status = reply.statusCode

      // Suppress only successful (2xx) recognised technical-health routes.
      if (status >= 200 && status < 300 && isTechnicalHealthRoute(url)) return done()

      const severity = classifySeverity(status)
      const event = buildHttpRequestEvent({
        method: request.method,
        url,
        status,
        durationMs,
        severity,
        user: request.user?.id,
        requestId: request.id || fallbackId,
        timestamp: new Date().toISOString(),
      })
      // Whitelisted call: pass the event object directly, no extra args.
      const logFn = fastify.log[severity] as (event: HttpRequestEvent) => void
      logFn(event)
    } catch {
      // Never let observability break the request pipeline.
    }
    done()
  })
}

export default fp(observabilityPlugin, {
  name: 'http-request-observability',
})
