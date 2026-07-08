/**
 * Unit tests for tier constants and tierAtLeast function.
 *
 * These tests assert the NEW contract for trial-first model:
 * - UserTier is only 'FREE' | 'PRO' (FREE is lockout, not a plan)
 * - tierAtLeast uses FREE as the base tier
 * - TRIAL_DURATION_DAYS is 21
 * - FREE tier limits are 0 (locked out)
 * - PRO tier has full access
 * - Yearly price is 999_00 MXN cents ($999)
 * - Yearly savings is 17%
 *
 * Spec: trial-first-model
 */

import { describe, it, expect } from 'vitest'
import {
  TRIAL_DURATION_DAYS,
  TRIAL_PLAN,
  PLATE_LIMITS,
  BABY_PROFILE_LIMITS,
  DIARY_WINDOW_DAYS,
  SNACK_LIMITS,
  PRICING,
  tierAtLeast,
} from './tiers.js'

// ──────────────────────────────────────────────────────────────────────────────
// UserTier contract — no ANONYMOUS, FREE is lockout state
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

describe('TRIAL_DURATION_DAYS', () => {
  it('is set to 21 days', () => {
    expect(TRIAL_DURATION_DAYS).toBe(21)
  })
})

describe('TRIAL_PLAN', () => {
  it('is set to TRIAL', () => {
    expect(TRIAL_PLAN).toBe('TRIAL')
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// FREE tier limits (lockout state)
// ──────────────────────────────────────────────────────────────────────────────

describe('PLATE_LIMITS', () => {
  it('has FREE set to 0 (locked out)', () => {
    expect(PLATE_LIMITS.FREE).toBe(0)
  })

  it('has PRO set to Infinity', () => {
    expect(PLATE_LIMITS.PRO).toBe(Infinity)
  })
})

describe('BABY_PROFILE_LIMITS', () => {
  it('has FREE set to 0 (locked out)', () => {
    expect(BABY_PROFILE_LIMITS.FREE).toBe(0)
  })

  it('has PRO set to 3', () => {
    expect(BABY_PROFILE_LIMITS.PRO).toBe(3)
  })
})

describe('DIARY_WINDOW_DAYS', () => {
  it('has FREE set to 0 (locked out)', () => {
    expect(DIARY_WINDOW_DAYS.FREE).toBe(0)
  })

  it('has PRO set to Infinity', () => {
    expect(DIARY_WINDOW_DAYS.PRO).toBe(Infinity)
  })
})

describe('SNACK_LIMITS', () => {
  it('has FREE set to 0 (locked out)', () => {
    expect(SNACK_LIMITS.FREE).toBe(0)
  })

  it('has PRO set to Infinity', () => {
    expect(SNACK_LIMITS.PRO).toBe(Infinity)
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