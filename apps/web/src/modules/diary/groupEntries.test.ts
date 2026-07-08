/**
 * groupDiaryEntries — regression tests for diary timeline grouping.
 *
 * These cover the snack-grouping bug: a served snack has multiple FoodLog
 * entries sharing a `snackId` (but NO `plateId`). The buggy version dumped
 * every non-plate entry into `standalone`, so each snack food rendered as its
 * own card. The fix groups by `snackId` too, mirroring plate grouping.
 */
import { describe, expect, it } from 'vitest'
import { MealType } from '@pakulab/shared'
import type { MealLog } from '@pakulab/shared'
import { groupDiaryEntries } from './groupEntries'

/** Build a MealLog with sane defaults; override only what the test cares about. */
function makeEntry(overrides: Partial<MealLog> & { id: string }): MealLog {
  return {
    date: '2026-07-08',
    mealType: MealType.BREAKFAST,
    reaction: null,
    foodId: `food-${overrides.id}`,
    babyProfileId: 'baby-1',
    userId: 'user-1',
    createdAt: '2026-07-08T08:00:00.000Z',
    ...overrides,
  }
}

describe('groupDiaryEntries', () => {
  // ── 1. Served snack (2 foods, same snackId, no plateId) → ONE group ──
  it('groups a served snack (2 foods, same snackId) into ONE mealGroup', () => {
    const entries: MealLog[] = [
      makeEntry({ id: 'a', snackId: 'snack-1', mealType: MealType.SNACK_1 }),
      makeEntry({ id: 'b', snackId: 'snack-1', mealType: MealType.SNACK_1 }),
    ]

    const { mealGroups, standalone } = groupDiaryEntries(entries)

    // The bug produced 2 standalone cards; the fix produces 1 grouped card.
    expect(standalone).toHaveLength(0)
    expect(mealGroups).toHaveLength(1)
    expect(mealGroups[0].id).toBe('snack-1')
    expect(mealGroups[0].mealType).toBe(MealType.SNACK_1)
    expect(mealGroups[0].entries).toHaveLength(2)
    expect(mealGroups[0].entries.map((e) => e.id)).toEqual(['a', 'b'])
  })

  // ── 2. Served plate (2 foods, same plateId) → ONE group (regression) ──
  it('groups a served plate (2 foods, same plateId) into ONE mealGroup', () => {
    const entries: MealLog[] = [
      makeEntry({ id: 'a', plateId: 'plate-1', mealType: MealType.BREAKFAST }),
      makeEntry({ id: 'b', plateId: 'plate-1', mealType: MealType.BREAKFAST }),
    ]

    const { mealGroups, standalone } = groupDiaryEntries(entries)

    expect(standalone).toHaveLength(0)
    expect(mealGroups).toHaveLength(1)
    expect(mealGroups[0].id).toBe('plate-1')
    expect(mealGroups[0].mealType).toBe(MealType.BREAKFAST)
    expect(mealGroups[0].entries).toHaveLength(2)
  })

  // ── 3. Manual single-food log (no plateId, no snackId) → standalone ──
  it('keeps a manual single-food log (no plateId, no snackId) as standalone', () => {
    const entries: MealLog[] = [
      makeEntry({ id: 'a', mealType: MealType.LUNCH }),
    ]

    const { mealGroups, standalone } = groupDiaryEntries(entries)

    expect(mealGroups).toHaveLength(0)
    expect(standalone).toHaveLength(1)
    expect(standalone[0].id).toBe('a')
  })

  // ── 4. Two DIFFERENT snacks same day → 2 separate groups ──
  it('produces 2 separate mealGroups for two different snacks (different snackId)', () => {
    const entries: MealLog[] = [
      makeEntry({ id: 'a', snackId: 'snack-1', mealType: MealType.SNACK_1 }),
      makeEntry({ id: 'b', snackId: 'snack-1', mealType: MealType.SNACK_1 }),
      makeEntry({ id: 'c', snackId: 'snack-2', mealType: MealType.SNACK_2 }),
    ]

    const { mealGroups, standalone } = groupDiaryEntries(entries)

    expect(standalone).toHaveLength(0)
    expect(mealGroups).toHaveLength(2)
    const ids = mealGroups.map((g) => g.id).sort()
    expect(ids).toEqual(['snack-1', 'snack-2'])
    const snack1 = mealGroups.find((g) => g.id === 'snack-1')
    const snack2 = mealGroups.find((g) => g.id === 'snack-2')
    expect(snack1?.entries).toHaveLength(2)
    expect(snack2?.entries).toHaveLength(1)
  })

  // ── 5. Snack group carries balanceLabel = null (snacks have no A/L score) ──
  it('sets balanceLabel to null for a snack group (snacks have no balance score)', () => {
    const entries: MealLog[] = [
      makeEntry({ id: 'a', snackId: 'snack-1', mealType: MealType.SNACK_1 }),
    ]

    const { mealGroups } = groupDiaryEntries(entries)

    expect(mealGroups).toHaveLength(1)
    expect(mealGroups[0].balanceLabel).toBeNull()
  })
})
