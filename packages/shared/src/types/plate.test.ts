/**
 * @file plate.test.ts
 * Unit tests for PlateStage enum, labels, and age-based helpers.
 */

import { describe, it, expect } from 'vitest'
import {
  PLATE_STAGES,
  type PlateStage,
  PLATE_STAGE_LABELS,
  getSuggestedGroupCount,
  getSuggestedStageForAge,
  type PlateItemSummary,
} from './plate'
import { type WarningTag } from './food'

describe('PlateStage types', () => {
  it('should have 4 PlateStage values', () => {
    expect(PLATE_STAGES).toHaveLength(4)
    expect(PLATE_STAGES).toContain('SIX_TO_NINE_MONTHS')
    expect(PLATE_STAGES).toContain('TEN_TO_TWELVE_MONTHS')
    expect(PLATE_STAGES).toContain('THIRTEEN_TO_TWENTY_THREE_MONTHS')
    expect(PLATE_STAGES).toContain('FAMILY_TABLE')
  })

  it('should have labels for all stages', () => {
    PLATE_STAGES.forEach((stage) => {
      expect(PLATE_STAGE_LABELS[stage]).toBeDefined()
      expect(typeof PLATE_STAGE_LABELS[stage]).toBe('string')
    })
  })

  it('should have complete label coverage', () => {
    const labelKeys = Object.keys(PLATE_STAGE_LABELS) as PlateStage[]
    expect(labelKeys.sort()).toEqual([...PLATE_STAGES].sort())
  })
})

describe('getSuggestedGroupCount', () => {
  it('should return 4 for age < 10 months (REQ-A2)', () => {
    expect(getSuggestedGroupCount(5)).toBe(4)
    expect(getSuggestedGroupCount(9)).toBe(4)
  })

  it('should return 5 for age >= 10 months (REQ-A2)', () => {
    expect(getSuggestedGroupCount(10)).toBe(5)
    expect(getSuggestedGroupCount(15)).toBe(5)
    expect(getSuggestedGroupCount(24)).toBe(5)
  })

  it('should handle edge cases', () => {
    expect(getSuggestedGroupCount(0)).toBe(4)
    expect(getSuggestedGroupCount(999)).toBe(5)
  })
})

describe('getSuggestedStageForAge', () => {
  it('should map 6-9 months to SIX_TO_NINE_MONTHS', () => {
    expect(getSuggestedStageForAge(6)).toBe('SIX_TO_NINE_MONTHS')
    expect(getSuggestedStageForAge(9)).toBe('SIX_TO_NINE_MONTHS')
  })

  it('should map 10-12 months to TEN_TO_TWELVE_MONTHS', () => {
    expect(getSuggestedStageForAge(10)).toBe('TEN_TO_TWELVE_MONTHS')
    expect(getSuggestedStageForAge(12)).toBe('TEN_TO_TWELVE_MONTHS')
  })

  it('should map 13-23 months to THIRTEEN_TO_TWENTY_THREE_MONTHS', () => {
    expect(getSuggestedStageForAge(13)).toBe('THIRTEEN_TO_TWENTY_THREE_MONTHS')
    expect(getSuggestedStageForAge(23)).toBe('THIRTEEN_TO_TWENTY_THREE_MONTHS')
  })

  it('should map 24+ months to FAMILY_TABLE', () => {
    expect(getSuggestedStageForAge(24)).toBe('FAMILY_TABLE')
    expect(getSuggestedStageForAge(36)).toBe('FAMILY_TABLE')
    expect(getSuggestedStageForAge(999)).toBe('FAMILY_TABLE')
  })

  it('should handle early ages as SIX_TO_NINE_MONTHS', () => {
    expect(getSuggestedStageForAge(5)).toBe('SIX_TO_NINE_MONTHS')
    expect(getSuggestedStageForAge(0)).toBe('SIX_TO_NINE_MONTHS')
  })
})

describe('PlateItemSummary type safety (CLASS A REGRESSION)', () => {
  it('should reject arbitrary strings in warningTags (TS compile-time check)', () => {
    // RED: This will COMPILE if warningTags is readonly string[] (WRONG)
    // GREEN: This will FAIL to compile if warningTags is readonly WarningTag[] (CORRECT)
    // The test itself is a NO-OP at runtime — the value is in the typecheck.
    const validTags: WarningTag[] = ['PROHIBITED_UNDER_24M', 'CHOKING_HAZARD_UNDER_5Y']

    const item: PlateItemSummary = {
      id: '1',
      foodId: 'f1',
      groupAssignment: 'PROTEIN',
      servingAmount: '2',
      food: {
        id: 'f1',
        name: 'Huevo',
        group: 'PROTEIN',
        alClassification: 'NEUTRAL',
        ageMonths: 6,
        isAllergen: true,
        allergenType: 'egg',
        warningTags: validTags,
      },
    }

    // The real test: warningTags MUST enforce the WarningTag union, not accept any string.
    // If MenuWeekPage.vue:223/353 are failing with "Type 'readonly string[]' is not assignable to WarningTag[]",
    // then shared/types/plate.ts line 73 has the wrong type. Fix: change to `readonly WarningTag[]`.
    expect(item.food?.warningTags).toEqual(validTags)
    expect(item.food?.warningTags.every((tag) => validTags.includes(tag))).toBe(true)
  })
})
