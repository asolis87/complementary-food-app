/**
 * useDashboardTips composable tests.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BALANCE_TIPS, STAGE_TIPS } from '@pakulab/shared'
import { useDashboardTips, useStageTip } from './useDashboardTips.js'

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

// ── useStageTip tests ────────────────────────────────────────────────────────

describe('useStageTip', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns a tip from the correct stage for 6-9 months', () => {
    // Arrange
    const ageMonths = 8

    // Act
    const { tip } = useStageTip(ageMonths)

    // Assert
    expect(STAGE_TIPS.SIX_TO_NINE_MONTHS).toContain(tip.value)
  })

  it('returns a tip from the correct stage for 10-12 months', () => {
    // Arrange
    const ageMonths = 11

    // Act
    const { tip } = useStageTip(ageMonths)

    // Assert
    expect(STAGE_TIPS.TEN_TO_TWELVE_MONTHS).toContain(tip.value)
  })

  it('returns a tip from the correct stage for 13-17 months', () => {
    // Arrange
    const ageMonths = 14

    // Act
    const { tip } = useStageTip(ageMonths)

    // Assert
    expect(STAGE_TIPS.THIRTEEN_TO_SEVENTEEN_MONTHS).toContain(tip.value)
  })

  it('returns a tip from the correct stage for 18-23 months', () => {
    // Arrange
    const ageMonths = 20

    // Act
    const { tip } = useStageTip(ageMonths)

    // Assert
    expect(STAGE_TIPS.EIGHTEEN_TO_TWENTY_THREE_MONTHS).toContain(tip.value)
  })

  it('does not return the same tip immediately after reshuffle', () => {
    // Arrange — force first pick to be index 0, second pick to be index 1
    const mockRandom = vi.spyOn(Math, 'random')
    mockRandom.mockReturnValueOnce(0) // First tip → index 0
    mockRandom.mockReturnValueOnce(0.17) // Second tip → index 1 (6 tips, 1/6 ≈ 0.166)

    const ageMonths = 11
    const { tip, reshuffle } = useStageTip(ageMonths)

    // Act
    const firstTip = tip.value
    reshuffle()
    const secondTip = tip.value

    // Assert
    expect(firstTip).not.toBe(secondTip)
    expect(STAGE_TIPS.TEN_TO_TWELVE_MONTHS).toContain(firstTip)
    expect(STAGE_TIPS.TEN_TO_TWELVE_MONTHS).toContain(secondTip)
  })

  it('changes tips when age crosses stage boundaries', () => {
    // Arrange — 8 months (6-9 stage), then 14 months (13-17 stage)
    const { tip: tip1 } = useStageTip(8)
    const { tip: tip2 } = useStageTip(14)

    // Assert — tips should come from different stage arrays
    expect(STAGE_TIPS.SIX_TO_NINE_MONTHS).toContain(tip1.value)
    expect(STAGE_TIPS.THIRTEEN_TO_SEVENTEEN_MONTHS).toContain(tip2.value)
  })

  // Triangulation — boundary ages
  it('maps boundary ages to correct stages', () => {
    // Arrange & Act
    const { tip: tip9 } = useStageTip(9) // boundary within 6-9
    const { tip: tip10 } = useStageTip(10) // boundary start 10-12
    const { tip: tip13 } = useStageTip(13) // boundary start 13-17
    const { tip: tip18 } = useStageTip(18) // boundary start 18-23

    // Assert
    expect(STAGE_TIPS.SIX_TO_NINE_MONTHS).toContain(tip9.value)
    expect(STAGE_TIPS.TEN_TO_TWELVE_MONTHS).toContain(tip10.value)
    expect(STAGE_TIPS.THIRTEEN_TO_SEVENTEEN_MONTHS).toContain(tip13.value)
    expect(STAGE_TIPS.EIGHTEEN_TO_TWENTY_THREE_MONTHS).toContain(tip18.value)
  })

  it('getTip returns the current tip', () => {
    // Arrange
    const { getTip, tip } = useStageTip(11)

    // Act & Assert
    expect(getTip()).toBe(tip.value)
  })

  it('exposes the tips array for the current stage', () => {
    // Arrange
    const { tips } = useStageTip(11)

    // Assert
    expect(tips).toBe(STAGE_TIPS.TEN_TO_TWELVE_MONTHS)
    expect(tips.length).toBe(6)
  })

  // Triangulation — no immediate repeat across multiple reshuffles
  it('avoids immediate repeats across multiple reshuffles', () => {
    // Arrange
    const { tip, reshuffle } = useStageTip(11)

    // Act & Assert — run 10 reshuffles, ensure each new tip differs from previous
    let previousTip = tip.value
    for (let i = 0; i < 10; i++) {
      reshuffle()
      const currentTip = tip.value
      // With 6 tips in the stage, random should give different tip most of the time
      // (not guaranteed 100%, but with retry logic in _pickRandomStageTip, should always differ)
      expect(currentTip).not.toBe(previousTip)
      expect(STAGE_TIPS.TEN_TO_TWELVE_MONTHS).toContain(currentTip)
      previousTip = currentTip
    }
  })
})
