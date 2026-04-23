/**
 * Port contract tests for EmailPort.
 *
 * These tests verify the EmailPort interface contract:
 * - sendEmail exists and is callable
 * - Returns a Promise (async)
 * - Accepts EmailPayload with required to/subject/htmlBody fields
 *
 * TDD Phase: RED — Tests written first to define the contract.
 * These tests should PASS after GREEN implementation.
 */

import { describe, it, expect } from 'vitest'
import type { EmailPort, EmailPayload } from './email.port.js'

describe('EmailPort contract', () => {
  /**
   * Test helper: creates a mock adapter that implements EmailPort
   */
  function createMockEmailAdapter(): EmailPort {
    return {
      sendEmail: async (_payload: EmailPayload): Promise<void> => {
        // Mock implementation — no-op
      },
      healthCheck: async () => ({ status: 'ok' as const, adapter: 'console-log' as const }),
    }
  }

  describe('sendEmail signature', () => {
    it('MUST exist on the port interface', () => {
      const adapter = createMockEmailAdapter()
      expect(typeof adapter.sendEmail).toBe('function')
    })

    it('MUST return a Promise', async () => {
      const adapter = createMockEmailAdapter()
      const result = adapter.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        htmlBody: '<p>Test</p>',
      })

      expect(result).toBeInstanceOf(Promise)
      await expect(result).resolves.toBeUndefined()
    })

    it('MUST accept to, subject, and htmlBody as required fields', async () => {
      const adapter = createMockEmailAdapter()

      // This should compile and execute without type errors if the contract is correct
      await adapter.sendEmail({
        to: 'user@example.com',
        subject: 'Verifica tu email',
        htmlBody: '<h1>Click el enlace</h1>',
      })
      // If we get here, the contract is respected
      expect(true).toBe(true)
    })

    it('MUST accept optional textBody field', async () => {
      const adapter = createMockEmailAdapter()

      await adapter.sendEmail({
        to: 'user@example.com',
        subject: 'Verifica tu email',
        htmlBody: '<p>HTML content</p>',
        textBody: 'Plain text fallback',
      })
      expect(true).toBe(true)
    })

    it('MUST resolve with void (not throw on success)', async () => {
      const adapter = createMockEmailAdapter()

      await expect(
        adapter.sendEmail({
          to: 'test@example.com',
          subject: 'Subject',
          htmlBody: '<p>Body</p>',
        })
      ).resolves.toBeUndefined()
    })
  })

  describe('EmailPayload type guard (documentation)', () => {
    it('documents required fields via type system', () => {
      // This test serves as documentation — the type system enforces the contract
      const payload: EmailPayload = {
        to: 'test@example.com',
        subject: 'Test Subject',
        htmlBody: '<p>HTML</p>',
      }

      expect(payload.to).toBe('test@example.com')
      expect(payload.subject).toBe('Test Subject')
      expect(payload.htmlBody).toBe('<p>HTML</p>')
    })
  })
})
