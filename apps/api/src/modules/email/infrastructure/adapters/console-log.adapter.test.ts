/**
 * Unit tests for ConsoleLogAdapter.
 *
 * Verifies:
 * - Logs email fields to console
 * - Resolves without error
 * - Catches and logs errors gracefully without throwing
 *
 * TDD Phase: GREEN — Implementation passes existing tests.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ConsoleLogAdapter } from './console-log.adapter.js'
import type { EmailPayload } from '../../domain/ports/email.port.js'

describe('ConsoleLogAdapter', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
    vi.restoreAllMocks()
  })

  // ===========================================================================
  // HAPPY PATH TESTS
  // ===========================================================================

  it('logs email "To" field', async () => {
    const adapter = new ConsoleLogAdapter()

    await adapter.sendEmail({
      to: 'test@example.com',
      subject: 'Verifica tu email',
      htmlBody: '<p>Click aquí</p>',
    })

    expect(consoleSpy).toHaveBeenCalled()
    const logCall = consoleSpy.mock.calls.find((call) =>
      call[0]?.toString().includes('To:')
    )
    expect(logCall).toBeDefined()
    if (logCall) {
      expect(logCall[0]).toContain('To:')
      expect(logCall[0]).toContain('test@example.com')
    }
  })

  it('logs email "Subject" field', async () => {
    const adapter = new ConsoleLogAdapter()

    await adapter.sendEmail({
      to: 'user@example.com',
      subject: 'Restablece tu contraseña',
      htmlBody: '<p>Link</p>',
    })

    const logCall = consoleSpy.mock.calls.find((call) =>
      call[0]?.toString().includes('Subject:')
    )
    expect(logCall).toBeDefined()
    if (logCall) {
      expect(logCall[0]).toContain('Restablece tu contraseña')
    }
  })

  it('logs email htmlBody', async () => {
    const adapter = new ConsoleLogAdapter()
    const testHtml = '<h1>Bienvenido</h1><p>Gracias por registrarte</p>'

    await adapter.sendEmail({
      to: 'user@example.com',
      subject: 'Subject',
      htmlBody: testHtml,
    })

    const logCall = consoleSpy.mock.calls.find((call) =>
      call[0]?.toString().includes('HTML:')
    )
    expect(logCall).toBeDefined()
    // The html should appear in the console output
    if (logCall) {
      expect(JSON.stringify(logCall)).toContain(testHtml)
    }
  })

  it('logs textBody when provided', async () => {
    const adapter = new ConsoleLogAdapter()
    const testText = 'Plain text fallback'

    await adapter.sendEmail({
      to: 'user@example.com',
      subject: 'Subject',
      htmlBody: '<p>HTML</p>',
      textBody: testText,
    })

    const logCall = consoleSpy.mock.calls.find((call) =>
      call[0]?.toString().includes('Text:')
    )
    expect(logCall).toBeDefined()
    if (logCall) {
      expect(logCall[0]).toContain(testText)
    }
  })

  it('resolves without throwing on success', async () => {
    const adapter = new ConsoleLogAdapter()

    await expect(
      adapter.sendEmail({
        to: 'user@example.com',
        subject: 'Test',
        htmlBody: '<p>Test</p>',
      })
    ).resolves.toBeUndefined()
  })

  // ===========================================================================
  // ERROR CASE TESTS
  // ===========================================================================

  it('throws when instantiated with NODE_ENV=production (audit M-06)', () => {
    const original = process.env['NODE_ENV']
    process.env['NODE_ENV'] = 'production'
    try {
      expect(() => new ConsoleLogAdapter()).toThrow(/must not be used in production/)
    } finally {
      if (original === undefined) delete process.env['NODE_ENV']
      else process.env['NODE_ENV'] = original
    }
  })

  it('instantiates normally when NODE_ENV is not production', () => {
    const original = process.env['NODE_ENV']
    process.env['NODE_ENV'] = 'development'
    try {
      expect(() => new ConsoleLogAdapter()).not.toThrow()
    } finally {
      if (original === undefined) delete process.env['NODE_ENV']
      else process.env['NODE_ENV'] = original
    }
  })

  it('catches and logs errors without throwing', async () => {
    // Force console.log to throw during the adapter call
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // Override the beforeEach mock with a throwing one for this test
    vi.spyOn(console, 'log').mockImplementation(() => {
      throw new Error('Console unavailable')
    })

    const adapter = new ConsoleLogAdapter()

    // Should NOT throw even though console.log throws
    await expect(
      adapter.sendEmail({
        to: 'user@example.com',
        subject: 'Subject',
        htmlBody: '<p>Body</p>',
      })
    ).resolves.toBeUndefined()

    // error should be called with the caught error
    expect(errorSpy).toHaveBeenCalled()

    errorSpy.mockRestore()
  })
})
