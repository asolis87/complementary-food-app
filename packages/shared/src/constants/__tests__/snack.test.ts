/**
 * Unit tests for snack composition helpers.
 * REQ-SM4: Age-suggested snack composition (non-blocking).
 */

import { describe, it, expect } from 'vitest'
import { getSnackGroupsForAge, getMissingSnackGroups } from '../snack.js'

describe('getSnackGroupsForAge', () => {
  it('should return empty array for baby under 10 months', () => {
    expect(getSnackGroupsForAge(8)).toEqual([])
    expect(getSnackGroupsForAge(9)).toEqual([])
  })

  it('should return 2 groups (FAT + CEREAL) for 10-12 months', () => {
    expect(getSnackGroupsForAge(10)).toEqual(['HEALTHY_FAT', 'CEREAL_TUBER'])
    expect(getSnackGroupsForAge(11)).toEqual(['HEALTHY_FAT', 'CEREAL_TUBER'])
    expect(getSnackGroupsForAge(12)).toEqual(['HEALTHY_FAT', 'CEREAL_TUBER'])
  })

  it('should return 3 groups (FAT + CEREAL + FRUIT) for 13+ months', () => {
    expect(getSnackGroupsForAge(13)).toEqual(['HEALTHY_FAT', 'CEREAL_TUBER', 'FRUIT'])
    expect(getSnackGroupsForAge(15)).toEqual(['HEALTHY_FAT', 'CEREAL_TUBER', 'FRUIT'])
    expect(getSnackGroupsForAge(20)).toEqual(['HEALTHY_FAT', 'CEREAL_TUBER', 'FRUIT'])
  })

  it('should handle exact boundary at 10 months', () => {
    expect(getSnackGroupsForAge(10)).toEqual(['HEALTHY_FAT', 'CEREAL_TUBER'])
  })

  it('should handle exact boundary at 13 months', () => {
    expect(getSnackGroupsForAge(13)).toEqual(['HEALTHY_FAT', 'CEREAL_TUBER', 'FRUIT'])
  })

  it('should return empty array for invalid age (NaN/Infinity) — no snack, not the 13m+ fallthrough', () => {
    expect(getSnackGroupsForAge(NaN)).toEqual([])
    expect(getSnackGroupsForAge(Infinity)).toEqual([])
  })
})

describe('getMissingSnackGroups', () => {
  it('should return empty array when all suggested groups are present', () => {
    const items11m = [
      { groupAssignment: 'HEALTHY_FAT' as const },
      { groupAssignment: 'CEREAL_TUBER' as const },
    ]
    expect(getMissingSnackGroups(items11m, 11)).toEqual([])

    const items15m = [
      { groupAssignment: 'HEALTHY_FAT' as const },
      { groupAssignment: 'CEREAL_TUBER' as const },
      { groupAssignment: 'FRUIT' as const },
    ]
    expect(getMissingSnackGroups(items15m, 15)).toEqual([])
  })

  it('should return missing group for 11-month-old with only one group', () => {
    const items = [{ groupAssignment: 'HEALTHY_FAT' as const }]
    expect(getMissingSnackGroups(items, 11)).toEqual(['CEREAL_TUBER'])
  })

  it('should return missing group for 15-month-old without fruit', () => {
    const items = [
      { groupAssignment: 'HEALTHY_FAT' as const },
      { groupAssignment: 'CEREAL_TUBER' as const },
    ]
    expect(getMissingSnackGroups(items, 15)).toEqual(['FRUIT'])
  })

  it('should return all suggested groups when items are empty', () => {
    expect(getMissingSnackGroups([], 11)).toEqual(['HEALTHY_FAT', 'CEREAL_TUBER'])
    expect(getMissingSnackGroups([], 15)).toEqual(['HEALTHY_FAT', 'CEREAL_TUBER', 'FRUIT'])
  })

  it('should return empty array for babies under 10 months (no snacks suggested)', () => {
    const items = [{ groupAssignment: 'HEALTHY_FAT' as const }]
    expect(getMissingSnackGroups(items, 8)).toEqual([])
  })

  // suggest-not-enforce (REQ-SM4): extra/duplicate groups beyond the age
  // suggestion are TOLERATED — nothing is "missing", so no warning is raised.
  it('should report nothing missing when a snack has extra groups beyond the suggestion', () => {
    // 11m suggestion is [FAT, CEREAL]; a FRUIT (a 13m+ group) is extra, not missing.
    const withExtra = [
      { groupAssignment: 'HEALTHY_FAT' as const },
      { groupAssignment: 'CEREAL_TUBER' as const },
      { groupAssignment: 'FRUIT' as const },
    ]
    expect(getMissingSnackGroups(withExtra, 11)).toEqual([])
  })

  it('should report the missing group even when another group is duplicated', () => {
    // Two fats, no cereal @11m → CEREAL_TUBER is still flagged missing (dupes collapse).
    const dupeFat = [
      { groupAssignment: 'HEALTHY_FAT' as const },
      { groupAssignment: 'HEALTHY_FAT' as const },
    ]
    expect(getMissingSnackGroups(dupeFat, 11)).toEqual(['CEREAL_TUBER'])
  })
})
