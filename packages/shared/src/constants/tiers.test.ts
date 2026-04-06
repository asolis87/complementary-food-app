/**
 * Unit tests for tier constants and tierAtLeast function.
 *
 * These tests assert the NEW contract after removing ANONYMOUS:
 * - UserTier is only 'FREE' | 'PRO' (no ANONYMOUS)
 * - tierAtLeast uses FREE as the base tier
 * - TRIAL_TRIGGER.trialDays is 21
 * - Yearly price is 999_00 MXN cents ($999)
 * - Yearly savings is 17%
 *
 * TDD: These tests should FAIL initially because the code still has
 * ANONYMOUS and uses old values. They pass after T2 is implemented.
 *
 * Spec: remove-anonymous-add-trial-billing
 */

import { describe, it, expect } from 'vitest'
import { PLATE_LIMITS, BABY_PROFILE_LIMITS, DIARY_WINDOW_DAYS, PRICING, TRIAL_TRIGGER, tierAtLeast } from './tiers.js'

// ──────────────────────────────────────────────────────────────────────────────
// UserTier contract — no ANONYMOUS
// ──────────────────────────────────────────────────────────────────────────────

describe('PLATE_LIMITS', () => {
  it('contains only FREE and PRO keys (no ANONYMOUS)', () => {
    const keys = Object.keys(PLATE_LIMITS) as string[]
    expect(keys).toHaveLength(2)
    expect(keys).toContain('FREE')
    expect(keys).toContain('PRO')
    expect(keys).not.toContain('ANONYMOUS')
  })
})

describe('BABY_PROFILE_LIMITS', () => {
  it('contains only FREE and PRO keys (no ANONYMOUS)', () => {
    const keys = Object.keys(BABY_PROFILE_LIMITS) as string[]
    expect(keys).toHaveLength(2)
    expect(keys).toContain('FREE')
    expect(keys).toContain('PRO')
    expect(keys).not.toContain('ANONYMOUS')
  })
})

describe('DIARY_WINDOW_DAYS', () => {
  it('contains only FREE and PRO keys (no ANONYMOUS)', () => {
    const keys = Object.keys(DIARY_WINDOW_DAYS) as string[]
    expect(keys).toHaveLength(2)
    expect(keys).toContain('FREE')
    expect(keys).toContain('PRO')
    expect(keys).not.toContain('ANONYMOUS')
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// tierAtLeast — two-tier ordering
// ──────────────────────────────────────────────────────────────────────────────

describe('tierAtLeast', () => {
  it('returns true when checking FREE >= FREE', () => {
    expect(tierAtLeast('FREE', 'FREE')).toBe(true)
  })

  it('returns true when checking PRO >= FREE', () => {
    expect(tierAtLeast('PRO', 'FREE')).toBe(true)
  })

  it('returns true when checking PRO >= PRO', () => {
    expect(tierAtLeast('PRO', 'PRO')).toBe(true)
  })

  it('returns false when checking FREE >= PRO', () => {
    expect(tierAtLeast('FREE', 'PRO')).toBe(false)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// Trial configuration
// ──────────────────────────────────────────────────────────────────────────────

describe('TRIAL_TRIGGER', () => {
  it('has trialDays set to 21', () => {
    expect(TRIAL_TRIGGER.trialDays).toBe(21)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// Pricing configuration
// ──────────────────────────────────────────────────────────────────────────────

describe('PRICING', () => {
  it('has yearly price of 999_00 MXN cents ($999)', () => {
    expect(PRICING.yearly.amountMxn).toBe(999_00)
  })

  it('has yearly savings of 17%', () => {
    expect(PRICING.yearly.savingsPercent).toBe(17)
  })
})