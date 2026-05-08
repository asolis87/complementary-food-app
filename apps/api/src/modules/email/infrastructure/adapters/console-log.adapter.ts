/**
 * ConsoleLog Email Adapter — development/test adapter.
 *
 * Design: AD-EV-03 — Hexagonal email module.
 * Spec: REQ-ED-01 — ConsoleLogAdapter for development.
 *
 * Logs email details to console without sending.
 * Always resolves immediately (no network calls).
 */

import type {
  EmailHealthStatus,
  EmailPayload,
  EmailPort,
} from '../../domain/ports/email.port.js'

export class ConsoleLogAdapter implements EmailPort {
  /**
   * Audit M-06 (A08:2021): refuse instantiation in production. The factory
   * already routes by NODE_ENV, but a misconfiguration must NOT silently
   * leak email bodies (which contain reset/verification URLs) to logs.
   */
  constructor() {
    if (process.env['NODE_ENV'] === 'production') {
      throw new Error(
        'ConsoleLogAdapter must not be used in production. Configure ResendAdapter instead.',
      )
    }
  }

  async healthCheck(): Promise<EmailHealthStatus> {
    return { status: 'ok', adapter: 'console-log' }
  }


  /**
   * Sends email by logging to console.
   * Never throws — errors are caught and logged.
   */
  async sendEmail(payload: EmailPayload): Promise<void> {
    try {
      console.log('\n📧 [ConsoleLogAdapter] Email sent')
      console.log('─'.repeat(50))
      console.log(`To:     ${payload.to}`)
      console.log(`Subject: ${payload.subject}`)
      console.log(`HTML:\n${payload.htmlBody}`)
      if (payload.textBody) {
        console.log(`Text:\n${payload.textBody}`)
      }
      console.log('─'.repeat(50) + '\n')
    } catch (err) {
      // Log but never throw — caller must not fail due to email
      console.error('[ConsoleLogAdapter] Failed to log email:', err)
    }
  }
}
