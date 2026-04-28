import { describe, expect, it } from 'vitest'
import { sanitizeText, sanitizeOptional } from './sanitize.js'

describe('sanitizeText', () => {
  it('returns plain text unchanged (after trim)', () => {
    expect(sanitizeText('Hola mundo')).toBe('Hola mundo')
    expect(sanitizeText('  spaced  ')).toBe('spaced')
  })

  it('strips script tags and their content', () => {
    expect(sanitizeText('<script>alert(1)</script>Hello')).toBe('Hello')
  })

  it('strips img tags with onerror handlers', () => {
    expect(sanitizeText('<img src=x onerror=alert(1)>')).toBe('')
  })

  it('strips inline tags but preserves text content', () => {
    expect(sanitizeText('Notas <b>importantes</b> sobre <i>fresas</i>')).toBe(
      'Notas importantes sobre fresas',
    )
  })

  it('strips anchor tags including href', () => {
    expect(sanitizeText('<a href="javascript:alert(1)">click</a>')).toBe('click')
  })

  it('returns empty string for whitespace-only input', () => {
    expect(sanitizeText('   ')).toBe('')
  })
})

describe('sanitizeOptional', () => {
  it('passes null through unchanged', () => {
    expect(sanitizeOptional(null)).toBeNull()
  })

  it('passes undefined through unchanged', () => {
    expect(sanitizeOptional(undefined)).toBeUndefined()
  })

  it('sanitizes string input', () => {
    expect(sanitizeOptional('<script>x</script>safe')).toBe('safe')
  })

  it('preserves the input type narrowing (string | undefined stays narrow)', () => {
    const v: string | undefined = 'hi'
    const result = sanitizeOptional(v)
    // Compile-time check: result is string | undefined, not string | null | undefined
    const _check: string | undefined = result
    expect(_check).toBe('hi')
  })
})
