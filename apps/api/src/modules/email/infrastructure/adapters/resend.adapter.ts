/**
 * Resend Email Adapter — production email delivery.
 *
 * Design: AD-EV-03, AD-EV-04 — Hexagonal email module with Resend SDK.
 * Spec: REQ-ED-01 — ResendAdapter implements EmailPort via Resend API.
 *
 * Uses RESEND_API_KEY env var. Catches and logs errors without throwing.
 */

import { Resend } from 'resend'
import type {
  EmailHealthStatus,
  EmailPayload,
  EmailPort,
} from '../../domain/ports/email.port.js'

function createResendClient(): Resend {
  const apiKey = process.env['RESEND_API_KEY']
  if (!apiKey) {
    throw new Error('RESEND_API_KEY no configurado')
  }
  return new Resend(apiKey)
}

// Lazy singleton — only instantiated when first used
let _resend: Resend | undefined

function getResend(): Resend {
  if (!_resend) {
    _resend = createResendClient()
  }
  return _resend
}

// Exported for testing — allows injecting a mock client
export function _resetResendSingleton(): void {
  _resend = undefined
}

/**
 * ResendAdapter — implements EmailPort for production email delivery.
 *
 * Features:
 * - Fire-and-forget async delivery
 * - Catches errors and logs them without throwing
 * - Uses RESEND_FROM_EMAIL env var as sender (defaults to noreply@pakulab.com)
 */
export class ResendAdapter implements EmailPort {
  private readonly fromEmail: string

  constructor() {
    this.fromEmail = process.env['RESEND_FROM_EMAIL'] ?? 'noreply@pakulab.com'
  }

  async healthCheck(): Promise<EmailHealthStatus> {
    const start = Date.now()
    try {
      const resend = getResend()
      const result = (await resend.domains.list()) as {
        data?: { data?: Array<{ name: string; status: string }> }
        error?: { message?: string }
      }
      const latencyMs = Date.now() - start

      if (result.error) {
        return {
          status: 'error',
          adapter: 'resend',
          fromEmail: this.fromEmail,
          latencyMs,
          reason: result.error.message ?? 'Resend API returned error',
        }
      }

      const domains = result.data?.data ?? []
      const verifiedDomains = domains.filter((d) => d.status === 'verified').map((d) => d.name)
      const fromDomain = this.fromEmail.split('@')[1] ?? ''
      const fromDomainVerified = verifiedDomains.includes(fromDomain)

      return {
        status: fromDomainVerified ? 'ok' : 'error',
        adapter: 'resend',
        fromEmail: this.fromEmail,
        verifiedDomains,
        latencyMs,
        ...(fromDomainVerified
          ? {}
          : { reason: `from-domain "${fromDomain}" is not in verified domains list` }),
      }
    } catch (err) {
      return {
        status: 'error',
        adapter: 'resend',
        fromEmail: this.fromEmail,
        latencyMs: Date.now() - start,
        reason: err instanceof Error ? err.message : 'unknown error',
      }
    }
  }

  async sendEmail(payload: EmailPayload): Promise<void> {
    try {
      const resend = getResend()
      await resend.emails.send({
        from: this.fromEmail,
        to: payload.to,
        subject: payload.subject,
        html: payload.htmlBody,
        text: payload.textBody,
      })
    } catch (err) {
      // Log but never throw — caller must not fail due to email delivery
      console.error('[ResendAdapter] Failed to send email:', err)
    }
  }
}
