/**
 * Unit tests for derivePlateBalanceLabel()
 *
 * Thresholds (from constants/balance.ts):
 *   BALANCE_THRESHOLD  = 0.34  → |score| ≤ 0.34  → BALANCED
 *   IMBALANCE_THRESHOLD = 0.67 → |score| ≤ 0.67  → SLIGHTLY_*
 *   otherwise                  → VERY_*
 *
 * Spec: REQ-AL-01 — deterministic, pure function.
 */

import { describe, it, expect } from 'vitest'
import { derivePlateBalanceLabel } from './balance.js'

describe('derivePlateBalanceLabel()', () => {
  // ─── BALANCED zone ──────────────────────────────────────────────────────────

  it('returns BALANCED for score 0.00 (exact center)', () => {
    expect(derivePlateBalanceLabel(0.0)).toBe('BALANCED')
  })

  it('returns BALANCED for score 0.34 (positive boundary — inclusive)', () => {
    expect(derivePlateBalanceLabel(0.34)).toBe('BALANCED')
  })

  it('returns BALANCED for score -0.34 (negative boundary — inclusive)', () => {
    expect(derivePlateBalanceLabel(-0.34)).toBe('BALANCED')
  })

  // ─── SLIGHTLY_ASTRINGENT zone ────────────────────────────────────────────────

  it('returns SLIGHTLY_ASTRINGENT for score 0.35 (just above BALANCE_THRESHOLD)', () => {
    expect(derivePlateBalanceLabel(0.35)).toBe('SLIGHTLY_ASTRINGENT')
  })

  it('returns SLIGHTLY_ASTRINGENT for score 0.67 (positive boundary — inclusive)', () => {
    expect(derivePlateBalanceLabel(0.67)).toBe('SLIGHTLY_ASTRINGENT')
  })

  // ─── VERY_ASTRINGENT zone ────────────────────────────────────────────────────

  it('returns VERY_ASTRINGENT for score 0.68 (just above IMBALANCE_THRESHOLD)', () => {
    expect(derivePlateBalanceLabel(0.68)).toBe('VERY_ASTRINGENT')
  })

  it('returns VERY_ASTRINGENT for score 1.00 (max positive)', () => {
    expect(derivePlateBalanceLabel(1.0)).toBe('VERY_ASTRINGENT')
  })

  // ─── SLIGHTLY_LAXATIVE zone ──────────────────────────────────────────────────

  it('returns SLIGHTLY_LAXATIVE for score -0.35 (just below -BALANCE_THRESHOLD)', () => {
    expect(derivePlateBalanceLabel(-0.35)).toBe('SLIGHTLY_LAXATIVE')
  })

  it('returns SLIGHTLY_LAXATIVE for score -0.67 (negative boundary — inclusive)', () => {
    expect(derivePlateBalanceLabel(-0.67)).toBe('SLIGHTLY_LAXATIVE')
  })

  // ─── VERY_LAXATIVE zone ──────────────────────────────────────────────────────

  it('returns VERY_LAXATIVE for score -0.68 (just below -IMBALANCE_THRESHOLD)', () => {
    expect(derivePlateBalanceLabel(-0.68)).toBe('VERY_LAXATIVE')
  })

  it('returns VERY_LAXATIVE for score -1.00 (max negative)', () => {
    expect(derivePlateBalanceLabel(-1.0)).toBe('VERY_LAXATIVE')
  })
})
