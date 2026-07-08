/**
 * Tests for date utility functions.
 */

import { describe, it, expect } from 'vitest'
import { getAgeMonths } from './date.js'

describe('getAgeMonths', () => {
  it('should return 0 for birth date today', () => {
    const today = new Date()
    expect(getAgeMonths(today)).toBe(0)
  })

  it('should return 6 for a baby born 6 months ago (same day)', () => {
    const now = new Date('2026-07-03')
    const sixMonthsAgo = new Date('2026-01-03')
    expect(getAgeMonths(sixMonthsAgo, now)).toBe(6)
  })

  it('should return 11 for a baby born 11 months ago', () => {
    const now = new Date('2026-07-03')
    const elevenMonthsAgo = new Date('2025-08-03')
    expect(getAgeMonths(elevenMonthsAgo, now)).toBe(11)
  })

  it('should handle birthday not yet reached this month', () => {
    // Today is July 3, baby born Aug 10 last year → 10 complete months (not 11)
    const now = new Date('2026-07-03')
    const birthDate = new Date('2025-08-10')
    expect(getAgeMonths(birthDate, now)).toBe(10)
  })

  it('should handle Date object input', () => {
    const now = new Date('2026-07-03')
    const birthDate = new Date('2026-01-03')
    expect(getAgeMonths(birthDate, now)).toBe(6)
  })

  it('should handle string input', () => {
    const now = new Date('2026-07-03')
    const birthDate = '2026-01-03'
    expect(getAgeMonths(birthDate, now)).toBe(6)
  })

  it('should default to Date.now() when referenceDate not provided', () => {
    // This test will be flaky if run at midnight boundary, but acceptable for unit test
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    const result = getAgeMonths(oneMonthAgo)
    expect(result).toBeGreaterThanOrEqual(0)
    expect(result).toBeLessThanOrEqual(2) // Allow some margin
  })

  it('should return 0 for an unparseable date string (no NaN leak)', () => {
    // Guards against corrupted birthDate silently suggesting the oldest stage:
    // NaN < 10 is false, so without the guard a 6-month-old would get "5 groups".
    expect(getAgeMonths('not-a-date')).toBe(0)
  })

  it('should return 0 for a future birthDate (negative age clamped)', () => {
    const now = new Date('2026-07-03')
    const future = new Date('2027-01-01')
    expect(getAgeMonths(future, now)).toBe(0)
  })
})
