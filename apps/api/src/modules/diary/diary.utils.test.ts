/**
 * Unit tests for the aggregateFoodHistory pure function.
 *
 * Spec: Plato↔Bitácora Connection — AD-1 aggregation logic.
 * Spec: REQ-D1, REQ-D2 — hasSuspectedReaction derived from DayObservation, not FoodLog.reaction.
 * All tests are pure (no DB, no HTTP, no side effects).
 */

import { describe, it, expect } from 'vitest'
import { aggregateFoodHistory } from './diary.utils.js'
import type { FoodLogEntry, DayObservationEntry } from './diary.utils.js'

// Helper to create a date offset from today
function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

// Helper to create a fixed ISO date string for stable test dates
function dateString(n: number): string {
  return daysAgo(n).toISOString().split('T')[0] as string
}

// ──────────────────────────────────────────────────────────────────────────────
// aggregateFoodHistory
// ──────────────────────────────────────────────────────────────────────────────

describe('aggregateFoodHistory', () => {
  // ── Empty entries ────────────────────────────────────────────────────────

  it('returns zeroed-out entries for all requested foods when entries array is empty', () => {
    const result = aggregateFoodHistory([], [], ['food-1', 'food-2'])

    expect(result['food-1']).toEqual({
      foodId: 'food-1',
      timesOffered: 0,
      reactions: [],
      lastReaction: null,
      lastDate: null,
      firstDate: null,
      hasSuspectedReaction: false,
    })
    expect(result['food-2']).toEqual({
      foodId: 'food-2',
      timesOffered: 0,
      reactions: [],
      lastReaction: null,
      lastDate: null,
      firstDate: null,
      hasSuspectedReaction: false,
    })
  })

  it('returns an empty object when both entries and requestedFoodIds are empty', () => {
    const result = aggregateFoodHistory([], [], [])
    expect(result).toEqual({})
  })

  // ── timesOffered ─────────────────────────────────────────────────────────

  it('counts timesOffered correctly for a single food', () => {
    const entries: FoodLogEntry[] = [
      { foodId: 'food-1', reaction: 'LIKED', date: daysAgo(1) },
      { foodId: 'food-1', reaction: null, date: daysAgo(2) },
      { foodId: 'food-1', reaction: 'DISLIKED', date: daysAgo(3) },
    ]
    const result = aggregateFoodHistory(entries, [], ['food-1'])
    expect(result['food-1']?.timesOffered).toBe(3)
  })

  it('counts timesOffered independently for each food', () => {
    const entries: FoodLogEntry[] = [
      { foodId: 'food-1', reaction: 'LIKED', date: daysAgo(1) },
      { foodId: 'food-2', reaction: 'NEUTRAL', date: daysAgo(2) },
      { foodId: 'food-2', reaction: 'DISLIKED', date: daysAgo(3) },
    ]
    const result = aggregateFoodHistory(entries, [], ['food-1', 'food-2', 'food-3'])
    expect(result['food-1']?.timesOffered).toBe(1)
    expect(result['food-2']?.timesOffered).toBe(2)
    expect(result['food-3']?.timesOffered).toBe(0) // never offered
  })

  // ── Reactions deduplication ───────────────────────────────────────────────

  it('deduplicates reactions for the same food', () => {
    const entries: FoodLogEntry[] = [
      { foodId: 'food-1', reaction: 'LIKED', date: daysAgo(1) },
      { foodId: 'food-1', reaction: 'LIKED', date: daysAgo(2) },
      { foodId: 'food-1', reaction: 'DISLIKED', date: daysAgo(3) },
    ]
    const result = aggregateFoodHistory(entries, [], ['food-1'])
    expect(result['food-1']?.reactions).toHaveLength(2)
    expect(result['food-1']?.reactions).toContain('LIKED')
    expect(result['food-1']?.reactions).toContain('DISLIKED')
  })

  it('excludes null reactions from the reactions array', () => {
    const entries: FoodLogEntry[] = [
      { foodId: 'food-1', reaction: null, date: daysAgo(1) },
      { foodId: 'food-1', reaction: null, date: daysAgo(2) },
    ]
    const result = aggregateFoodHistory(entries, [], ['food-1'])
    expect(result['food-1']?.reactions).toEqual([])
  })

  // ── lastReaction — must be the most recent NON-NULL reaction ─────────────

  it('lastReaction is the most recent non-null reaction, not just the most recent entry', () => {
    // Entry order: most recent first (as Prisma returns with orderBy date desc)
    const entries: FoodLogEntry[] = [
      { foodId: 'food-1', reaction: null, date: daysAgo(1) },   // most recent, no reaction yet
      { foodId: 'food-1', reaction: 'LIKED', date: daysAgo(3) }, // older, has reaction
    ]
    const result = aggregateFoodHistory(entries, [], ['food-1'])
    // Should use 'LIKED' (most recent non-null), NOT null (which would be a bug)
    expect(result['food-1']?.lastReaction).toBe('LIKED')
  })

  it('lastReaction is null when all entries have null reactions', () => {
    const entries: FoodLogEntry[] = [
      { foodId: 'food-1', reaction: null, date: daysAgo(1) },
      { foodId: 'food-1', reaction: null, date: daysAgo(2) },
    ]
    const result = aggregateFoodHistory(entries, [], ['food-1'])
    expect(result['food-1']?.lastReaction).toBeNull()
  })

  it('lastReaction is null for a food that was never offered', () => {
    const result = aggregateFoodHistory([], [], ['food-1'])
    expect(result['food-1']?.lastReaction).toBeNull()
  })

  it('lastReaction uses the most recent reaction when multiple are present', () => {
    // Ordered by date desc (most recent first)
    const entries: FoodLogEntry[] = [
      { foodId: 'food-1', reaction: 'DISLIKED', date: daysAgo(1) },
      { foodId: 'food-1', reaction: 'LIKED', date: daysAgo(5) },
    ]
    const result = aggregateFoodHistory(entries, [], ['food-1'])
    expect(result['food-1']?.lastReaction).toBe('DISLIKED')
  })

  it('lastReaction skips multiple consecutive null entries to find last non-null', () => {
    // Ordered by date desc
    const entries: FoodLogEntry[] = [
      { foodId: 'food-1', reaction: null, date: daysAgo(1) },
      { foodId: 'food-1', reaction: null, date: daysAgo(2) },
      { foodId: 'food-1', reaction: null, date: daysAgo(3) },
      { foodId: 'food-1', reaction: 'NEUTRAL', date: daysAgo(10) },
    ]
    const result = aggregateFoodHistory(entries, [], ['food-1'])
    expect(result['food-1']?.lastReaction).toBe('NEUTRAL')
  })

  // ── lastDate ──────────────────────────────────────────────────────────────

  it('lastDate is the date of the most recent entry (regardless of reaction)', () => {
    const today = daysAgo(0)
    const entries: FoodLogEntry[] = [
      { foodId: 'food-1', reaction: null, date: today },
      { foodId: 'food-1', reaction: 'LIKED', date: daysAgo(5) },
    ]
    const result = aggregateFoodHistory(entries, [], ['food-1'])
    const expectedDate = today.toISOString().split('T')[0]
    expect(result['food-1']?.lastDate).toBe(expectedDate)
  })

  it('lastDate is null when the food was never offered', () => {
    const result = aggregateFoodHistory([], [], ['food-1'])
    expect(result['food-1']?.lastDate).toBeNull()
  })

  // ── firstDate ─────────────────────────────────────────────────────────────

  it('firstDate is the date of the OLDEST entry for the food', () => {
    const entries: FoodLogEntry[] = [
      { foodId: 'food-1', reaction: null, date: daysAgo(0) },
      { foodId: 'food-1', reaction: 'LIKED', date: daysAgo(5) },
      { foodId: 'food-1', reaction: 'NEUTRAL', date: daysAgo(10) },
    ]
    const result = aggregateFoodHistory(entries, [], ['food-1'])
    const expectedDate = daysAgo(10).toISOString().split('T')[0]
    expect(result['food-1']?.firstDate).toBe(expectedDate)
  })

  it('firstDate is null when the food was never offered', () => {
    const result = aggregateFoodHistory([], [], ['food-1'])
    expect(result['food-1']?.firstDate).toBeNull()
  })

  it('firstDate equals lastDate when food was offered exactly once', () => {
    const onlyDate = daysAgo(3)
    const entries: FoodLogEntry[] = [
      { foodId: 'food-1', reaction: 'LIKED', date: onlyDate },
    ]
    const result = aggregateFoodHistory(entries, [], ['food-1'])
    const key = onlyDate.toISOString().split('T')[0]
    expect(result['food-1']?.firstDate).toBe(key)
    expect(result['food-1']?.lastDate).toBe(key)
  })

  // ── hasSuspectedReaction — derived from DayObservation (REQ-D1, REQ-D2) ──

  it('hasSuspectedReaction is true when day has ALLERGY_SUSPECT symptom', () => {
    const day1 = daysAgo(1)
    const observations: DayObservationEntry[] = [
      { date: day1, symptoms: ['ALLERGY_SUSPECT'] },
    ]
    const entries: FoodLogEntry[] = [
      { foodId: 'food-1', reaction: 'LIKED', date: day1 },
    ]
    const result = aggregateFoodHistory(entries, observations, ['food-1'])
    expect(result['food-1']?.hasSuspectedReaction).toBe(true)
  })

  it('hasSuspectedReaction is true when day has RASH symptom', () => {
    const day1 = daysAgo(1)
    const observations: DayObservationEntry[] = [
      { date: day1, symptoms: ['RASH'] },
    ]
    const entries: FoodLogEntry[] = [
      { foodId: 'food-1', reaction: 'NEUTRAL', date: day1 },
    ]
    const result = aggregateFoodHistory(entries, observations, ['food-1'])
    expect(result['food-1']?.hasSuspectedReaction).toBe(true)
  })

  it('hasSuspectedReaction is false when day has only GAS symptom (GAS does not activate suspect signal)', () => {
    const day1 = daysAgo(1)
    const observations: DayObservationEntry[] = [
      { date: day1, symptoms: ['GAS'] },
    ]
    const entries: FoodLogEntry[] = [
      { foodId: 'food-1', reaction: 'LIKED', date: day1 },
    ]
    const result = aggregateFoodHistory(entries, observations, ['food-1'])
    expect(result['food-1']?.hasSuspectedReaction).toBe(false)
  })

  it('hasSuspectedReaction is false when no observation exists for that day', () => {
    const entries: FoodLogEntry[] = [
      { foodId: 'food-1', reaction: 'DISLIKED', date: daysAgo(1) },
    ]
    const result = aggregateFoodHistory(entries, [], ['food-1'])
    expect(result['food-1']?.hasSuspectedReaction).toBe(false)
  })

  it('hasSuspectedReaction is false for a food never offered', () => {
    const result = aggregateFoodHistory([], [], ['food-1'])
    expect(result['food-1']?.hasSuspectedReaction).toBe(false)
  })

  it('hasSuspectedReaction is false when food has DISLIKED reaction but no relevant observation', () => {
    const entries: FoodLogEntry[] = [
      { foodId: 'food-1', reaction: 'DISLIKED', date: daysAgo(1) },
    ]
    // Observation for a different day
    const observations: DayObservationEntry[] = [
      { date: daysAgo(5), symptoms: ['ALLERGY_SUSPECT'] },
    ]
    const result = aggregateFoodHistory(entries, observations, ['food-1'])
    expect(result['food-1']?.hasSuspectedReaction).toBe(false)
  })

  it('hasSuspectedReaction coalesces to false (never undefined)', () => {
    const result = aggregateFoodHistory([], [], ['food-1'])
    // Must be exactly false, not undefined or null
    expect(result['food-1']?.hasSuspectedReaction).toBe(false)
  })

  it('hasSuspectedReaction true for food on day with multiple symptoms including RASH', () => {
    const day1 = daysAgo(2)
    const observations: DayObservationEntry[] = [
      { date: day1, symptoms: ['GAS', 'RASH', 'VOMITING'] },
    ]
    const entries: FoodLogEntry[] = [
      { foodId: 'food-1', reaction: null, date: day1 },
    ]
    const result = aggregateFoodHistory(entries, observations, ['food-1'])
    expect(result['food-1']?.hasSuspectedReaction).toBe(true)
  })

  // ── Entries for unrequested foods are ignored ─────────────────────────────

  it('ignores entries for food IDs not in requestedFoodIds', () => {
    const entries: FoodLogEntry[] = [
      { foodId: 'food-not-requested', reaction: 'DISLIKED', date: daysAgo(1) },
    ]
    const result = aggregateFoodHistory(entries, [], ['food-1'])
    expect(result['food-not-requested']).toBeUndefined()
    expect(result['food-1']?.timesOffered).toBe(0)
  })

  // ── Mixed scenario (the real-world case) ─────────────────────────────────

  it('handles a mixed scenario correctly — offered and not-offered foods, varied reactions', () => {
    const day1 = daysAgo(1)
    const day3 = daysAgo(3)
    const day7 = daysAgo(7)
    const day14 = daysAgo(14)

    const entries: FoodLogEntry[] = [
      // food-1: offered 3 times — most recent no reaction, older entries have LIKED + DISLIKED
      { foodId: 'food-1', reaction: null, date: day1 },
      { foodId: 'food-1', reaction: 'LIKED', date: day7 },
      { foodId: 'food-1', reaction: 'DISLIKED', date: day14 },
      // food-2: offered once with no reaction, but has RASH observation
      { foodId: 'food-2', reaction: 'NEUTRAL', date: day3 },
      // food-3: not offered
    ]

    // Day 3 has RASH observation
    const observations: DayObservationEntry[] = [
      { date: day3, symptoms: ['RASH'] },
    ]

    const result = aggregateFoodHistory(entries, observations, ['food-1', 'food-2', 'food-3'])

    // food-1: no suspect observation on any of its days
    expect(result['food-1']?.timesOffered).toBe(3)
    expect(result['food-1']?.lastReaction).toBe('LIKED') // most recent non-null
    expect(result['food-1']?.lastDate).toBe(day1.toISOString().split('T')[0])
    expect(result['food-1']?.reactions).toContain('LIKED')
    expect(result['food-1']?.reactions).toContain('DISLIKED')
    expect(result['food-1']?.hasSuspectedReaction).toBe(false)

    // food-2: served on day3 which has RASH → suspect
    expect(result['food-2']?.timesOffered).toBe(1)
    expect(result['food-2']?.lastReaction).toBe('NEUTRAL')
    expect(result['food-2']?.hasSuspectedReaction).toBe(true)

    // food-3 (never offered)
    expect(result['food-3']?.timesOffered).toBe(0)
    expect(result['food-3']?.lastReaction).toBeNull()
    expect(result['food-3']?.lastDate).toBeNull()
    expect(result['food-3']?.hasSuspectedReaction).toBe(false)
  })

  it('hasSuspectedReaction true only for foods served on the day with the suspect observation', () => {
    const day1 = daysAgo(1)
    const day2 = daysAgo(2)

    // Day 1 has ALLERGY_SUSPECT, day 2 has GAS only
    const observations: DayObservationEntry[] = [
      { date: day1, symptoms: ['ALLERGY_SUSPECT'] },
      { date: day2, symptoms: ['GAS'] },
    ]
    const entries: FoodLogEntry[] = [
      { foodId: 'food-1', reaction: 'LIKED', date: day1 }, // on suspect day
      { foodId: 'food-2', reaction: 'LIKED', date: day2 }, // on gas-only day
    ]
    const result = aggregateFoodHistory(entries, observations, ['food-1', 'food-2'])
    expect(result['food-1']?.hasSuspectedReaction).toBe(true)
    expect(result['food-2']?.hasSuspectedReaction).toBe(false)
  })

  it('uses the same date key format for both logs and observations (YYYY-MM-DD)', () => {
    // Verifies that FoodLog.date and DayObservation.date produce the same key
    const baseDate = new Date('2025-06-10T12:00:00Z')
    const observations: DayObservationEntry[] = [
      { date: baseDate, symptoms: ['RASH'] },
    ]
    const entries: FoodLogEntry[] = [
      { foodId: 'food-1', reaction: null, date: baseDate },
    ]
    const result = aggregateFoodHistory(entries, observations, ['food-1'])
    expect(result['food-1']?.hasSuspectedReaction).toBe(true)
  })
})
