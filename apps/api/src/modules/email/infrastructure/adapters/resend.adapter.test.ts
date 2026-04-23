/**
 * Unit tests for ResendAdapter.
 *
 * Verifies:
 * - Calls Resend API with correct payload
 * - Catches delivery errors gracefully without throwing
 * - Uses fromEmail from constructor/env
 *
 * TDD Phase: GREEN — Implementation passes existing tests.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ResendAdapter } from './resend.adapter.js'

// Use hoisted mock so it's available before module evaluation
const mockSendFn = vi.fn()

vi.mock('resend', () => {
  return {
    Resend: vi.fn().mockImplementation(() => ({
      emails: {
        send: mockSendFn,
      },
    })),
  }
})

describe('ResendAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSendFn.mockResolvedValue({ data: { id: 'email_123' }, error: null })
    // Set env vars for each test
    vi.stubEnv('RESEND_API_KEY', 're_test_123')
    vi.stubEnv('RESEND_FROM_EMAIL', 'test@example.com')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  // ===========================================================================
  // HAPPY PATH TESTS
  // ===========================================================================

  it('calls Resend emails.send with correct from/to/subject/html', async () => {
    const adapter = new ResendAdapter()

    await adapter.sendEmail({
      to: 'user@example.com',
      subject: 'Verifica tu email',
      htmlBody: '<h1>Click aquí</h1>',
      textBody: 'Click aquí',
    })

    expect(mockSendFn).toHaveBeenCalledWith({
      from: 'test@example.com',
      to: 'user@example.com',
      subject: 'Verifica tu email',
      html: '<h1>Click aquí</h1>',
      text: 'Click aquí',
    })
  })

  it('passes correct fields to sendEmail', async () => {
    const adapter = new ResendAdapter()
    const testHtml = '<p>Hello World</p>'

    await adapter.sendEmail({
      to: 'test@example.com',
      subject: 'Test Subject',
      htmlBody: testHtml,
      textBody: 'Plain text',
    })

    expect(mockSendFn).toHaveBeenCalledTimes(1)
    const call = mockSendFn.mock.calls[0]?.[0]
    expect(call?.from).toBe('test@example.com')
    expect(call?.to).toBe('test@example.com')
    expect(call?.subject).toBe('Test Subject')
    expect(call?.html).toBe(testHtml)
    expect(call?.text).toBe('Plain text')
  })

  // ===========================================================================
  // ERROR CASE TESTS
  // ===========================================================================

  it('catches and logs errors without throwing', async () => {
    mockSendFn.mockRejectedValue(new Error('Resend API error'))

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const adapter = new ResendAdapter()

    // Should NOT throw
    await expect(
      adapter.sendEmail({
        to: 'user@example.com',
        subject: 'Test',
        htmlBody: '<p>Test</p>',
      })
    ).resolves.toBeUndefined()

    // Error should be logged
    expect(consoleSpy).toHaveBeenCalled()

    consoleSpy.mockRestore()
  })

  it('resolves successfully even when Resend returns error in response', async () => {
    // Resend returned an error object but didn't throw
    mockSendFn.mockResolvedValue({ data: null, error: { message: 'Invalid email' } })

    const adapter = new ResendAdapter()

    // Should NOT throw — the error is in the response, not thrown
    await expect(
      adapter.sendEmail({
        to: 'user@example.com',
        subject: 'Test',
        htmlBody: '<p>Test</p>',
      })
    ).resolves.toBeUndefined()
  })
})
