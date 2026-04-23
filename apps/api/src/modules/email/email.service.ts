/**
 * Email Service — factory + sendEmail entry point.
 *
 * Design: AD-EV-03 — Hexagonal email module as internal service.
 * Spec: REQ-ED-01 — EmailPort interface with factory pattern.
 *
 * Factory decides which adapter to use based on NODE_ENV:
 * - production: ResendAdapter
 * - development/test: ConsoleLogAdapter
 *
 * Fire-and-forget: sendEmail is async but caller does NOT await.
 */

import type { EmailHealthStatus, EmailPayload, EmailPort } from './domain/ports/email.port.js'
import { ResendAdapter } from './infrastructure/adapters/resend.adapter.js'
import { ConsoleLogAdapter } from './infrastructure/adapters/console-log.adapter.js'

// Lazy singleton for the adapter instance
let _adapter: EmailPort | undefined

/**
 * Returns the appropriate EmailPort adapter based on environment.
 * Factory pattern: select adapter at runtime, not at call site.
 */
export function getAdapter(): EmailPort {
  if (!_adapter) {
    _adapter = createAdapter()
  }
  return _adapter
}

/**
 * Factory: creates the right adapter for the current environment.
 */
function createAdapter(): EmailPort {
  const nodeEnv = process.env['NODE_ENV']

  if (nodeEnv === 'production') {
    return new ResendAdapter()
  }

  // development and test both use ConsoleLogAdapter
  // (ResendAdapter would require real API key which devs don't have)
  return new ConsoleLogAdapter()
}

/**
 * Sends an email asynchronously (fire-and-forget).
 *
 * The caller does NOT await this — email sending is non-blocking.
 * Errors are caught and logged by the adapter.
 */
/**
 * Checks whether the active email adapter can reach its provider.
 * Used by the `/api/health/email` endpoint for deep health monitoring.
 */
export async function checkEmailHealth(): Promise<EmailHealthStatus> {
  return getAdapter().healthCheck()
}

export function sendEmail(payload: EmailPayload): void {
  const adapter = getAdapter()

  // Fire and forget — don't await
  adapter.sendEmail(payload).catch((err) => {
    // This should rarely happen since adapters catch their own errors,
    // but if the adapter's promise rejects, log it
    console.error('[email.service] Unhandled email send error:', err)
  })
}
