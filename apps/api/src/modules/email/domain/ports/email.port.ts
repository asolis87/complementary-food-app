/**
 * Email Port — hexagonal interface for sending transactional emails.
 *
 * Design: AD-EV-03 — Hexagonal email module as internal service.
 * Spec: REQ-ED-01 — EmailPort interface contract.
 *
 * The port defines the contract for email delivery adapters.
 * Production uses ResendAdapter; development uses ConsoleLogAdapter.
 */

export interface EmailPayload {
  to: string
  subject: string
  htmlBody: string
  textBody?: string
}

/**
 * EmailPort contract — all adapters MUST implement this interface.
 *
 * sendEmail: Sends an email asynchronously.
 *   - to: recipient email address
 *   - subject: email subject line
 *   - htmlBody: HTML content body
 *   - textBody: optional plain-text fallback
 *
 * The implementation MUST:
 * - Be async (non-blocking — fire-and-forget from caller)
 * - Catch and log errors without throwing (caller never fails due to email)
 */
export interface EmailHealthStatus {
  status: 'ok' | 'error'
  adapter: 'console-log' | 'resend'
  fromEmail?: string
  verifiedDomains?: string[]
  latencyMs?: number
  reason?: string
}

export interface EmailPort {
  sendEmail(payload: EmailPayload): Promise<void>
  healthCheck(): Promise<EmailHealthStatus>
}
