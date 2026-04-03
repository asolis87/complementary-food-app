/**
 * Unit tests for the aggregateFoodHistory pure function.
 *
 * Spec: Plato↔Bitácora Connection — AD-1 aggregation logic.
 * All tests are pure (no DB, no HTTP, no side effects).
 */

import { describe, it, expect } from 'vitest'
import { aggregateFoodHistory } from './diary.utils.js'
import type { FoodLogEntry } from './diary.utils.js'

// Helper to create a date offset from today
function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

// ──────────────────────────────────────────────────────────────────────────────
// aggregateFoodHistory
// ──────────────────────────────────────────────────────────────────────────────

describe('aggregateFoodHistory', () => {
  // ── Empty entries ────────────────────────────────────────────────────────

  it('returns zeroed-out entries for all requested foods when entries array is empty', () => {
    const result = aggregateFoodHistory([], ['food-1', 'food-2'])

    expect(result['food-1']).toEqual({
      foodId: 'food-1',
      timesOffered: 0,
      reactions: [],
      lastReaction: null,
      lastDate: null,
      hasAllergyReaction: false,
    })
    expect(result['food-2']).toEqual({
      foodId: 'food-2',
      timesOffered: 0,
      reactions: [],
      lastReaction: null,
      lastDate: null,
      hasAllergyReaction: false,
    })
  })

  it('returns an empty object when both entries and requestedFoodIds are empty', () => {
    const result = aggregateFoodHistory([], [])
    expect(result).toEqual({})
  })

  // ── timesOffered ─────────────────────────────────────────────────────────

  it('counts timesOffered correctly for a single food', () => {
    const entries: FoodLogEntry[] = [
      { foodId: 'food-1', reaction: 'LIKED', date: daysAgo(1) },
      { foodId: 'food-1', reaction: null, date: daysAgo(2) },
      { foodId: 'food-1', reaction: 'GAS', date: daysAgo(3) },
    ]
    const result = aggregateFoodHistory(entries, ['food-1'])
    expect(result['food-1']?.timesOffered).toBe(3)
  })

  it('counts timesOffered independently for each food', () => {
    const entries: FoodLogEntry[] = [
      { foodId: 'food-1', reaction: 'LIKED', date: daysAgo(1) },
      { foodId: 'food-2', reaction: 'NEUTRAL', date: daysAgo(2) },
      { foodId: 'food-2', reaction: 'GAS', date: daysAgo(3) },
    ]
    const result = aggregateFoodHistory(entries, ['food-1', 'food-2', 'food-3'])
    expect(result['food-1']?.timesOffered).toBe(1)
    expect(result['food-2']?.timesOffered).toBe(2)
    expect(result['food-3']?.timesOffered).toBe(0) // never offered
  })

  // ── Reactions deduplication ───────────────────────────────────────────────

  it('deduplicates reactions for the same food', () => {
    const entries: FoodLogEntry[] = [
      { foodId: 'food-1', reaction: 'LIKED', date: daysAgo(1) },
      { foodId: 'food-1', reaction: 'LIKED', date: daysAgo(2) },
      { foodId: 'food-1', reaction: 'GAS', date: daysAgo(3) },
    ]
    const result = aggregateFoodHistory(entries, ['food-1'])
    expect(result['food-1']?.reactions).toHaveLength(2)
    expect(result['food-1']?.reactions).toContain('LIKED')
    expect(result['food-1']?.reactions).toContain('GAS')
  })

  it('excludes null reactions from the reactions array', () => {
    const entries: FoodLogEntry[] = [
      { foodId: 'food-1', reaction: null, date: daysAgo(1) },
      { foodId: 'food-1', reaction: null, date: daysAgo(2) },
    ]
    const result = aggregateFoodHistory(entries, ['food-1'])
    expect(result['food-1']?.reactions).toEqual([])
  })

  // ── lastReaction — must be the most recent NON-NULL reaction ─────────────

  it('lastReaction is the most recent non-null reaction, not just the most recent entry', () => {
    // Entry order: most recent first (as Prisma returns with orderBy date desc)
    const entries: FoodLogEntry[] = [
      { foodId: 'food-1', reaction: null, date: daysAgo(1) },   // most recent, no reaction yet
      { foodId: 'food-1', reaction: 'LIKED', date: daysAgo(3) }, // older, has reaction
    ]
    const result = aggregateFoodHistory(entries, ['food-1'])
    // Should use 'LIKED' (most recent non-null), NOT null (which would be a bug)
    expect(result['food-1']?.lastReaction).toBe('LIKED')
  })

  it('lastReaction is null when all entries have null reactions', () => {
    const entries: FoodLogEntry[] = [
      { foodId: 'food-1', reaction: null, date: daysAgo(1) },
      { foodId: 'food-1', reaction: null, date: daysAgo(2) },
    ]
    const result = aggregateFoodHistory(entries, ['food-1'])
    expect(result['food-1']?.lastReaction).toBeNull()
  })

  it('lastReaction is null for a food that was never offered', () => {
    const result = aggregateFoodHistory([], ['food-1'])
    expect(result['food-1']?.lastReaction).toBeNull()
  })

  it('lastReaction uses the most recent reaction when multiple are present', () => {
    // Ordered by date desc (most recent first)
    const entries: FoodLogEntry[] = [
      { foodId: 'food-1', reaction: 'GAS', date: daysAgo(1) },
      { foodId: 'food-1', reaction: 'LIKED', date: daysAgo(5) },
    ]
    const result = aggregateFoodHistory(entries, ['food-1'])
    expect(result['food-1']?.lastReaction).toBe('GAS')
  })

  it('lastReaction skips multiple consecutive null entries to find last non-null', () => {
    // Ordered by date desc
    const entries: FoodLogEntry[] = [
      { foodId: 'food-1', reaction: null, date: daysAgo(1) },
      { foodId: 'food-1', reaction: null, date: daysAgo(2) },
      { foodId: 'food-1', reaction: null, date: daysAgo(3) },
      { foodId: 'food-1', reaction: 'RASH', date: daysAgo(10) },
    ]
    const result = aggregateFoodHistory(entries, ['food-1'])
    expect(result['food-1']?.lastReaction).toBe('RASH')
  })

  // ── lastDate ──────────────────────────────────────────────────────────────

  it('lastDate is the date of the most recent entry (regardless of reaction)', () => {
    const today = daysAgo(0)
    const entries: FoodLogEntry[] = [
      { foodId: 'food-1', reaction: null, date: today },
      { foodId: 'food-1', reaction: 'LIKED', date: daysAgo(5) },
    ]
    const result = aggregateFoodHistory(entries, ['food-1'])
    const expectedDate = today.toISOString().split('T')[0]
    expect(result['food-1']?.lastDate).toBe(expectedDate)
  })

  it('lastDate is null when the food was never offered', () => {
    const result = aggregateFoodHistory([], ['food-1'])
    expect(result['food-1']?.lastDate).toBeNull()
  })

  // ── hasAllergyReaction ────────────────────────────────────────────────────

  it('hasAllergyReaction is true when ALLERGIC is present', () => {
    const entries: FoodLogEntry[] = [
      { foodId: 'food-1', reaction: 'ALLERGIC', date: daysAgo(1) },
    ]
    const result = aggregateFoodHistory(entries, ['food-1'])
    expect(result['food-1']?.hasAllergyReaction).toBe(true)
  })

  it('hasAllergyReaction is true when RASH is present', () => {
    const entries: FoodLogEntry[] = [
      { foodId: 'food-1', reaction: 'RASH', date: daysAgo(1) },
    ]
    const result = aggregateFoodHistory(entries, ['food-1'])
    expect(result['food-1']?.hasAllergyReaction).toBe(true)
  })

  it('hasAllergyReaction is false for GAS, DISLIKED, LIKED, NEUTRAL', () => {
    const entries: FoodLogEntry[] = [
      { foodId: 'food-1', reaction: 'GAS', date: daysAgo(1) },
      { foodId: 'food-1', reaction: 'DISLIKED', date: daysAgo(2) },
      { foodId: 'food-1', reaction: 'LIKED', date: daysAgo(3) },
      { foodId: 'food-1', reaction: 'NEUTRAL', date: daysAgo(4) },
    ]
    const result = aggregateFoodHistory(entries, ['food-1'])
    expect(result['food-1']?.hasAllergyReaction).toBe(false)
  })

  it('hasAllergyReaction is false for a food never offered', () => {
    const result = aggregateFoodHistory([], ['food-1'])
    expect(result['food-1']?.hasAllergyReaction).toBe(false)
  })

  // ── Entries for unrequested foods are ignored ─────────────────────────────

  it('ignores entries for food IDs not in requestedFoodIds', () => {
    const entries: FoodLogEntry[] = [
      { foodId: 'food-not-requested', reaction: 'ALLERGIC', date: daysAgo(1) },
    ]
    const result = aggregateFoodHistory(entries, ['food-1'])
    expect(result['food-not-requested']).toBeUndefined()
    expect(result['food-1']?.timesOffered).toBe(0)
  })

  // ── Mixed scenario (the real-world case) ─────────────────────────────────

  it('handles a mixed scenario correctly — offered and not-offered foods, varied reactions', () => {
    const entries: FoodLogEntry[] = [
      // food-1: offered 3 times — most recent no reaction, older entries have LIKED + GAS
      { foodId: 'food-1', reaction: null, date: daysAgo(1) },
      { foodId: 'food-1', reaction: 'LIKED', date: daysAgo(7) },
      { foodId: 'food-1', reaction: 'GAS', date: daysAgo(14) },
      // food-2: offered once with ALLERGIC
      { foodId: 'food-2', reaction: 'ALLERGIC', date: daysAgo(3) },
      // food-3: not offered
    ]

    const result = aggregateFoodHistory(entries, ['food-1', 'food-2', 'food-3'])

    // food-1
    expect(result['food-1']?.timesOffered).toBe(3)
    expect(result['food-1']?.lastReaction).toBe('LIKED') // most recent non-null
    expect(result['food-1']?.lastDate).toBe(daysAgo(1).toISOString().split('T')[0])
    expect(result['food-1']?.reactions).toContain('LIKED')
    expect(result['food-1']?.reactions).toContain('GAS')
    expect(result['food-1']?.hasAllergyReaction).toBe(false)

    // food-2
    expect(result['food-2']?.timesOffered).toBe(1)
    expect(result['food-2']?.lastReaction).toBe('ALLERGIC')
    expect(result['food-2']?.hasAllergyReaction).toBe(true)

    // food-3 (never offered)
    expect(result['food-3']?.timesOffered).toBe(0)
    expect(result['food-3']?.lastReaction).toBeNull()
    expect(result['food-3']?.lastDate).toBeNull()
    expect(result['food-3']?.hasAllergyReaction).toBe(false)
  })
})
