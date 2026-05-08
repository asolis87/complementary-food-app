/**
 * useDashboardTips composable tests.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BALANCE_TIPS } from '@pakulab/shared'
import { useDashboardTips } from './useDashboardTips.js'

describe('useDashboardTips', () => {
  beforeEach(() => {
    // Seed Math.random for deterministic tests
    vi.spyOn(Math, 'random').mockReturnValue(0)
  })

  it('returns a tip from the curated list', () => {
    const { tip } = useDashboardTips()
    expect(BALANCE_TIPS).toContain(tip.value)
  })

  it('returns different tips with different random seeds', () => {
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.5)

    const instance1 = useDashboardTips()
    const instance2 = useDashboardTips()

    // With seeds 0 and 0.5, they should map to different tips
    // (at least in a list of 8 items)
    expect(instance1.tip.value).not.toBe(instance2.tip.value)
  })

  it('reshuffle picks a new random tip', () => {
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.875)

    const { tip, reshuffle } = useDashboardTips()
    const firstTip = tip.value

    reshuffle()

    expect(tip.value).not.toBe(firstTip)
    expect(BALANCE_TIPS).toContain(tip.value)
  })

  it('getTip returns the current tip', () => {
    const { getTip, tip } = useDashboardTips()
    expect(getTip()).toBe(tip.value)
  })

  it('exposes the full BALANCE_TIPS list', () => {
    const { tips } = useDashboardTips()
    expect(tips).toBe(BALANCE_TIPS)
    expect(tips.length).toBe(8)
  })

  it('always returns from BALANCE_TIPS — never generates dynamically', () => {
    // Run 100 times to ensure all results are in the list
    for (let i = 0; i < 100; i++) {
      vi.spyOn(Math, 'random').mockReturnValueOnce(Math.random())
      const { tip } = useDashboardTips()
      expect(BALANCE_TIPS).toContain(tip.value)
    }
  })
})
