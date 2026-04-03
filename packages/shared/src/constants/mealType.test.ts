/**
 * Unit tests for meal type and day mappings.
 *
 * Validates that MEAL_KEY_TO_TYPE, DAY_KEY_TO_INDEX, and reverse mappings
 * are exhaustive and bidirectionally consistent.
 *
 * Spec: REQ-009 — MealType mapping coverage.
 * Design: AD-5, AD-6 — explicit mapping constants.
 */

import { describe, it, expect } from 'vitest'
import { MealType } from '../types/diary.js'
import {
  MEAL_KEY_TO_TYPE,
  MEAL_TYPE_TO_KEY,
  DAY_KEY_TO_INDEX,
  DAY_INDEX_TO_KEY,
  ACTIVE_MEAL_KEYS,
  DAY_KEYS,
  type MealKey,
  type DayKey,
} from './mealType.js'

// ──────────────────────────────────────────────────────────────────────────────
// MEAL_KEY_TO_TYPE — Exhaustiveness
// ──────────────────────────────────────────────────────────────────────────────

describe('MEAL_KEY_TO_TYPE', () => {
  it('maps all 6 meal keys to their corresponding MealType values', () => {
    expect(MEAL_KEY_TO_TYPE.desayuno).toBe(MealType.BREAKFAST)
    expect(MEAL_KEY_TO_TYPE.comida).toBe(MealType.LUNCH)
    expect(MEAL_KEY_TO_TYPE.cena).toBe(MealType.DINNER)
    expect(MEAL_KEY_TO_TYPE.snack1).toBe(MealType.SNACK_1)
    expect(MEAL_KEY_TO_TYPE.snack2).toBe(MealType.SNACK_2)
    expect(MEAL_KEY_TO_TYPE.snack).toBe(MealType.SNACK)
  })

  it('contains exactly 6 entries (one for each MealKey)', () => {
    expect(Object.keys(MEAL_KEY_TO_TYPE)).toHaveLength(6)
  })

  it('covers all MealType enum values', () => {
    const mappedTypes = Object.values(MEAL_KEY_TO_TYPE)
    const allMealTypes = Object.values(MealType)
    
    for (const mealType of allMealTypes) {
      expect(mappedTypes).toContain(mealType)
    }
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// MEAL_TYPE_TO_KEY — Reverse Mapping
// ──────────────────────────────────────────────────────────────────────────────

describe('MEAL_TYPE_TO_KEY', () => {
  it('maps all MealType enum values back to their meal keys', () => {
    expect(MEAL_TYPE_TO_KEY[MealType.BREAKFAST]).toBe('desayuno')
    expect(MEAL_TYPE_TO_KEY[MealType.LUNCH]).toBe('comida')
    expect(MEAL_TYPE_TO_KEY[MealType.DINNER]).toBe('cena')
    expect(MEAL_TYPE_TO_KEY[MealType.SNACK_1]).toBe('snack1')
    expect(MEAL_TYPE_TO_KEY[MealType.SNACK_2]).toBe('snack2')
    expect(MEAL_TYPE_TO_KEY[MealType.SNACK]).toBe('snack')
  })

  it('contains exactly 6 entries (one for each MealType)', () => {
    expect(Object.keys(MEAL_TYPE_TO_KEY)).toHaveLength(6)
  })

  it('is the perfect inverse of MEAL_KEY_TO_TYPE', () => {
    for (const [key, mealType] of Object.entries(MEAL_KEY_TO_TYPE)) {
      expect(MEAL_TYPE_TO_KEY[mealType as MealType]).toBe(key)
    }
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// DAY_KEY_TO_INDEX — Exhaustiveness
// ──────────────────────────────────────────────────────────────────────────────

describe('DAY_KEY_TO_INDEX', () => {
  it('maps all 7 day keys to their corresponding day indices (0-6)', () => {
    expect(DAY_KEY_TO_INDEX.lun).toBe(0) // Monday
    expect(DAY_KEY_TO_INDEX.mar).toBe(1) // Tuesday
    expect(DAY_KEY_TO_INDEX.mie).toBe(2) // Wednesday
    expect(DAY_KEY_TO_INDEX.jue).toBe(3) // Thursday
    expect(DAY_KEY_TO_INDEX.vie).toBe(4) // Friday
    expect(DAY_KEY_TO_INDEX.sab).toBe(5) // Saturday
    expect(DAY_KEY_TO_INDEX.dom).toBe(6) // Sunday
  })

  it('contains exactly 7 entries (one for each DayKey)', () => {
    expect(Object.keys(DAY_KEY_TO_INDEX)).toHaveLength(7)
  })

  it('covers all day indices from 0 to 6', () => {
    const mappedIndices = Object.values(DAY_KEY_TO_INDEX)
    expect(mappedIndices).toContain(0)
    expect(mappedIndices).toContain(1)
    expect(mappedIndices).toContain(2)
    expect(mappedIndices).toContain(3)
    expect(mappedIndices).toContain(4)
    expect(mappedIndices).toContain(5)
    expect(mappedIndices).toContain(6)
    expect(mappedIndices).toHaveLength(7)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// DAY_INDEX_TO_KEY — Reverse Mapping
// ──────────────────────────────────────────────────────────────────────────────

describe('DAY_INDEX_TO_KEY', () => {
  it('maps all day indices 0-6 back to their day keys', () => {
    expect(DAY_INDEX_TO_KEY[0]).toBe('lun')
    expect(DAY_INDEX_TO_KEY[1]).toBe('mar')
    expect(DAY_INDEX_TO_KEY[2]).toBe('mie')
    expect(DAY_INDEX_TO_KEY[3]).toBe('jue')
    expect(DAY_INDEX_TO_KEY[4]).toBe('vie')
    expect(DAY_INDEX_TO_KEY[5]).toBe('sab')
    expect(DAY_INDEX_TO_KEY[6]).toBe('dom')
  })

  it('contains exactly 7 entries (one for each index 0-6)', () => {
    expect(Object.keys(DAY_INDEX_TO_KEY)).toHaveLength(7)
  })

  it('is the perfect inverse of DAY_KEY_TO_INDEX', () => {
    for (const [key, index] of Object.entries(DAY_KEY_TO_INDEX)) {
      expect(DAY_INDEX_TO_KEY[index as number]).toBe(key)
    }
    
    for (let i = 0; i <= 6; i++) {
      expect(DAY_KEY_TO_INDEX[DAY_INDEX_TO_KEY[i] as DayKey]).toBe(i)
    }
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// ACTIVE_MEAL_KEYS — UI Meal Types
// ──────────────────────────────────────────────────────────────────────────────

describe('ACTIVE_MEAL_KEYS', () => {
  it('contains exactly 3 meal keys for the UI (desayuno, comida, cena)', () => {
    expect(ACTIVE_MEAL_KEYS).toHaveLength(3)
    expect(ACTIVE_MEAL_KEYS).toContain('desayuno')
    expect(ACTIVE_MEAL_KEYS).toContain('comida')
    expect(ACTIVE_MEAL_KEYS).toContain('cena')
  })

  it('contains only valid MealKey values', () => {
    const validMealKeys: MealKey[] = ['desayuno', 'comida', 'cena', 'snack1', 'snack2', 'snack']
    
    for (const key of ACTIVE_MEAL_KEYS) {
      expect(validMealKeys).toContain(key)
    }
  })

  it('all active keys have valid mappings in MEAL_KEY_TO_TYPE', () => {
    for (const key of ACTIVE_MEAL_KEYS) {
      expect(MEAL_KEY_TO_TYPE[key]).toBeDefined()
      expect(Object.values(MealType)).toContain(MEAL_KEY_TO_TYPE[key])
    }
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// DAY_KEYS — Day Key Array
// ──────────────────────────────────────────────────────────────────────────────

describe('DAY_KEYS', () => {
  it('contains exactly 7 day keys in order (Monday to Sunday)', () => {
    expect(DAY_KEYS).toHaveLength(7)
    expect(DAY_KEYS[0]).toBe('lun')
    expect(DAY_KEYS[1]).toBe('mar')
    expect(DAY_KEYS[2]).toBe('mie')
    expect(DAY_KEYS[3]).toBe('jue')
    expect(DAY_KEYS[4]).toBe('vie')
    expect(DAY_KEYS[5]).toBe('sab')
    expect(DAY_KEYS[6]).toBe('dom')
  })

  it('contains only valid DayKey values', () => {
    const validDayKeys: DayKey[] = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom']
    
    for (const key of DAY_KEYS) {
      expect(validDayKeys).toContain(key)
    }
  })

  it('DAY_KEYS index matches DAY_KEY_TO_INDEX mapping', () => {
    for (let i = 0; i < DAY_KEYS.length; i++) {
      const key = DAY_KEYS[i]!
      expect(DAY_KEY_TO_INDEX[key]).toBe(i)
      expect(DAY_INDEX_TO_KEY[i]).toBe(key)
    }
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// Integration — Round-trip Conversion
// ──────────────────────────────────────────────────────────────────────────────

describe('Round-trip conversions', () => {
  it('can convert any active meal key through the full round-trip', () => {
    for (const mealKey of ACTIVE_MEAL_KEYS) {
      const mealType = MEAL_KEY_TO_TYPE[mealKey]
      const backToKey = MEAL_TYPE_TO_KEY[mealType]
      expect(backToKey).toBe(mealKey)
    }
  })

  it('can convert any day key through the full round-trip', () => {
    for (const dayKey of DAY_KEYS) {
      const index = DAY_KEY_TO_INDEX[dayKey]
      const backToKey = DAY_INDEX_TO_KEY[index]
      expect(backToKey).toBe(dayKey)
    }
  })

  it('supports future meal types (snack1, snack2, snack) without breaking', () => {
    // These are not in ACTIVE_MEAL_KEYS but should have valid mappings
    const futureMealKeys: MealKey[] = ['snack1', 'snack2', 'snack']
    
    for (const key of futureMealKeys) {
      const mealType = MEAL_KEY_TO_TYPE[key]
      expect(mealType).toBeDefined()
      expect(MEAL_TYPE_TO_KEY[mealType]).toBe(key)
    }
  })
})
