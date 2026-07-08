import { describe, expect, it } from 'vitest'
import { MealType } from '@pakulab/shared'
import { autoSelectMealTypeForAge, getMealTypeOptions } from './mealTypeOptions'

describe('getMealTypeOptions', () => {
  it('returns 3 main meals for a 6-9 month baby (no snacks)', () => {
    const options = getMealTypeOptions(8)
    expect(options).toHaveLength(3)
    expect(options.map((o) => o.value)).toEqual([
      MealType.BREAKFAST,
      MealType.LUNCH,
      MealType.DINNER,
    ])
    // No SNACK variants in 3-meal layout
    expect(options.find((o) => o.value === MealType.SNACK_1)).toBeUndefined()
    expect(options.find((o) => o.value === MealType.SNACK_2)).toBeUndefined()
    // Legacy SNACK must never appear — would be invisible on the dashboard
    expect(options.find((o) => o.value === MealType.SNACK)).toBeUndefined()
  })

  it('returns 4 meals (with afternoon SNACK_1) for a 10-12 month baby', () => {
    const options = getMealTypeOptions(11)
    expect(options).toHaveLength(4)
    expect(options.map((o) => o.value)).toEqual([
      MealType.BREAKFAST,
      MealType.LUNCH,
      MealType.SNACK_1,
      MealType.DINNER,
    ])
  })

  it('returns 5 meals (SNACK_1 + SNACK_2) for a 13+ month baby', () => {
    const options = getMealTypeOptions(14)
    expect(options).toHaveLength(5)
    expect(options.map((o) => o.value)).toEqual([
      MealType.BREAKFAST,
      MealType.SNACK_1,
      MealType.LUNCH,
      MealType.SNACK_2,
      MealType.DINNER,
    ])
  })

  it('returns 3 meals for a 10 month baby at the boundary of the 4-meal stage', () => {
    // 9.5 should still be 3-meal (months < 10 is the threshold for the next stage)
    expect(getMealTypeOptions(9.5)).toHaveLength(3)
    // 10 exactly enters 4-meal
    expect(getMealTypeOptions(10)).toHaveLength(4)
  })

  it('returns 5 meals for a 13 month baby at the boundary of the 5-meal stage', () => {
    expect(getMealTypeOptions(12.5)).toHaveLength(4)
    expect(getMealTypeOptions(13)).toHaveLength(5)
  })

  it('falls back to 3 meals for negative or non-finite ages', () => {
    expect(getMealTypeOptions(-1)).toHaveLength(3)
    expect(getMealTypeOptions(NaN)).toHaveLength(3)
  })

  it('every option has label and icon', () => {
    for (const age of [8, 11, 14, 18]) {
      for (const opt of getMealTypeOptions(age)) {
        expect(opt.label.length).toBeGreaterThan(0)
        expect(opt.icon.length).toBeGreaterThan(0)
      }
    }
  })

  // REQ-SD8 (Snack Diary Integration): manual snack logging must expose the
  // age-appropriate colación slots so a served snack can be recorded/edited in
  // the bitácora. Regression-only: getMealTypeOptions delegates to
  // getMealSlotsForAge, so no production change is expected here.
  describe('REQ-SD8: age-aware snack options for manual diary logging', () => {
    it('exposes SNACK_1 (and no SNACK_2) for an 11-month baby (stage four)', () => {
      const values = getMealTypeOptions(11).map((o) => o.value)
      expect(values).toContain(MealType.SNACK_1)
      expect(values).not.toContain(MealType.SNACK_2)
    })

    it('exposes both SNACK_1 and SNACK_2 for a 15-month baby (stage five)', () => {
      const values = getMealTypeOptions(15).map((o) => o.value)
      expect(values).toContain(MealType.SNACK_1)
      expect(values).toContain(MealType.SNACK_2)
    })

    it('exposes NO snack options for an 8-month baby (stage three)', () => {
      const values = getMealTypeOptions(8).map((o) => o.value)
      expect(values).not.toContain(MealType.SNACK_1)
      expect(values).not.toContain(MealType.SNACK_2)
      expect(values).not.toContain(MealType.SNACK)
    })
  })
})

describe('autoSelectMealTypeForAge', () => {
  describe('babies < 10 months (3-meal layout, no SNACK variants)', () => {
    it('morning -> BREAKFAST', () => {
      expect(autoSelectMealTypeForAge(8, 8)).toBe(MealType.BREAKFAST)
    })
    it('midday -> LUNCH', () => {
      expect(autoSelectMealTypeForAge(8, 13)).toBe(MealType.LUNCH)
    })
    it('afternoon 16h -> DINNER (NOT SNACK — that variant does not exist for this age)', () => {
      // The regression: previous code returned SNACK for hour 15-18, but the
      // dashboard's getMealSlotsForAge(8) never returns a SNACK slot, so the
      // log was invisible. Fix: < 10m collapses SNACK-window into DINNER.
      expect(autoSelectMealTypeForAge(8, 16)).toBe(MealType.DINNER)
    })
    it('evening -> DINNER', () => {
      expect(autoSelectMealTypeForAge(8, 20)).toBe(MealType.DINNER)
    })
  })

  describe('babies 10-12 months (4-meal layout, SNACK_1 only)', () => {
    it('morning -> BREAKFAST', () => {
      expect(autoSelectMealTypeForAge(11, 8)).toBe(MealType.BREAKFAST)
    })
    it('midday -> LUNCH', () => {
      expect(autoSelectMealTypeForAge(11, 13)).toBe(MealType.LUNCH)
    })
    it('afternoon 16h -> SNACK_1 (the only colación for this age)', () => {
      expect(autoSelectMealTypeForAge(11, 16)).toBe(MealType.SNACK_1)
    })
    it('evening -> DINNER', () => {
      expect(autoSelectMealTypeForAge(11, 20)).toBe(MealType.DINNER)
    })
  })

  describe('babies 13+ months (5-meal layout, both SNACK variants)', () => {
    it('morning 10h -> SNACK_1 (mid-morning colación)', () => {
      expect(autoSelectMealTypeForAge(14, 10)).toBe(MealType.SNACK_1)
    })
    it('midday -> LUNCH', () => {
      expect(autoSelectMealTypeForAge(14, 13)).toBe(MealType.LUNCH)
    })
    it('afternoon 16h -> SNACK_2 (second colación)', () => {
      expect(autoSelectMealTypeForAge(14, 16)).toBe(MealType.SNACK_2)
    })
    it('evening -> DINNER', () => {
      expect(autoSelectMealTypeForAge(14, 20)).toBe(MealType.DINNER)
    })
    it('breakfast 8h -> BREAKFAST', () => {
      expect(autoSelectMealTypeForAge(14, 8)).toBe(MealType.BREAKFAST)
    })
  })

  it('never returns the legacy SNACK enum (would be invisible on the new dashboard)', () => {
    // Sweep the full 24h range for each stage. Legacy SNACK must never appear.
    for (const age of [6, 8, 9, 10, 11, 12, 13, 14, 18, 24]) {
      for (let hour = 0; hour < 24; hour++) {
        const picked = autoSelectMealTypeForAge(age, hour)
        expect(picked).not.toBe(MealType.SNACK)
      }
    }
  })
})
