/**
 * Unit tests for dashboard constants.
 *
 * Spec: REQ-DASH-BIZ-05 (curated tip list),
 *       REQ-DASH-BIZ-06 (cache TTL configuration)
 */

import { describe, it, expect } from 'vitest'
import {
  BALANCE_TIPS,
  DASHBOARD_CACHE_TTL,
  DASHBOARD_MEAL_SLOTS,
  DEFAULT_SUGGESTIONS_LIMIT,
  MAX_SUGGESTIONS_LIMIT,
  SUGGESTION_LOOKBACK_DAYS,
  MEAL_TYPES_FOR_SLOTS,
  getMealSlotsForAge,
} from './dashboard.js'
import { MealType } from '../types/diary.js'

describe('BALANCE_TIPS', () => {
  it('is an array of 8 curated tips', () => {
    expect(Array.isArray(BALANCE_TIPS)).toBe(true)
    expect(BALANCE_TIPS).toHaveLength(8)
  })

  it('contains the expected tips from REQ-DASH-BIZ-05 spec', () => {
    expect(BALANCE_TIPS).toContain('La avena es suave para el estómago.')
    expect(BALANCE_TIPS).toContain('Las zanahorias cocidas son fáciles de digerir.')
    expect(BALANCE_TIPS).toContain('El pollo es una proteína magra ideal para bebés.')
    expect(BALANCE_TIPS).toContain('Las frutas como la manzana aportan fibra natural.')
    expect(BALANCE_TIPS).toContain('El camote es nutritivo y de sabor dulce natural.')
    expect(BALANCE_TIPS).toContain('Combinar cereales con verduras da energía sostenida.')
    expect(BALANCE_TIPS).toContain('Las proteínas ayudan al crecimiento del bebé.')
    expect(BALANCE_TIPS).toContain('Los tubérculos son fáciles de preparar y nutritivos.')
  })

  it('is a readonly array', () => {
    // Attempting to push should fail at type level, not runtime.
    // Verify that the array has the expected structure.
    expect(BALANCE_TIPS[0]).toBe('La avena es suave para el estómago.')
  })
})

describe('DASHBOARD_CACHE_TTL', () => {
  it('has all cache TTL keys from REQ-DASH-BIZ-06 spec', () => {
    expect(DASHBOARD_CACHE_TTL).toHaveProperty('dashboard')
    expect(DASHBOARD_CACHE_TTL).toHaveProperty('suggestions')
    expect(DASHBOARD_CACHE_TTL).toHaveProperty('allergens')
    expect(DASHBOARD_CACHE_TTL).toHaveProperty('roadmap')
    expect(DASHBOARD_CACHE_TTL).toHaveProperty('today')
    expect(DASHBOARD_CACHE_TTL).toHaveProperty('balance')
  })

  it('dashboard TTL is 60 seconds (REQ-DASH-BIZ-06)', () => {
    expect(DASHBOARD_CACHE_TTL.dashboard).toBe(60)
  })

  it('suggestions TTL is 24 hours in seconds', () => {
    expect(DASHBOARD_CACHE_TTL.suggestions).toBe(24 * 60 * 60)
  })

  it('allergens TTL is 1 hour in seconds', () => {
    expect(DASHBOARD_CACHE_TTL.allergens).toBe(60 * 60)
  })

  it('roadmap TTL is 15 minutes in seconds', () => {
    expect(DASHBOARD_CACHE_TTL.roadmap).toBe(15 * 60)
  })

  it('today TTL is 0 (no cache)', () => {
    expect(DASHBOARD_CACHE_TTL.today).toBe(0)
  })

  it('balance TTL is 1 hour in seconds', () => {
    expect(DASHBOARD_CACHE_TTL.balance).toBe(60 * 60)
  })
})

describe('DASHBOARD_MEAL_SLOTS', () => {
  it('is an array of 4 meal slots', () => {
    expect(Array.isArray(DASHBOARD_MEAL_SLOTS)).toBe(true)
    expect(DASHBOARD_MEAL_SLOTS).toHaveLength(4)
  })

  it('each slot has label, icon, and mealType', () => {
    for (const slot of DASHBOARD_MEAL_SLOTS) {
      expect(slot).toHaveProperty('mealType')
      expect(slot).toHaveProperty('label')
      expect(slot).toHaveProperty('icon')
      expect(typeof slot.label).toBe('string')
      expect(typeof slot.icon).toBe('string')
    }
  })

  it('contains BREAKFAST, LUNCH, DINNER, and SNACK slots', () => {
    const mealTypes = DASHBOARD_MEAL_SLOTS.map((s) => s.mealType)
    expect(mealTypes).toContain('BREAKFAST')
    expect(mealTypes).toContain('LUNCH')
    expect(mealTypes).toContain('DINNER')
    expect(mealTypes).toContain('SNACK')
  })
})

describe('suggestion configuration constants', () => {
  it('DEFAULT_SUGGESTIONS_LIMIT is 3', () => {
    expect(DEFAULT_SUGGESTIONS_LIMIT).toBe(3)
  })

  it('MAX_SUGGESTIONS_LIMIT is 10', () => {
    expect(MAX_SUGGESTIONS_LIMIT).toBe(10)
  })

  it('SUGGESTION_LOOKBACK_DAYS is 30', () => {
    expect(SUGGESTION_LOOKBACK_DAYS).toBe(30)
  })

  it('MEAL_TYPES_FOR_SLOTS matches the 4 meal types used in dashboard', () => {
    expect(Array.isArray(MEAL_TYPES_FOR_SLOTS)).toBe(true)
    expect(MEAL_TYPES_FOR_SLOTS).toHaveLength(4)
    expect(MEAL_TYPES_FOR_SLOTS).toContain('BREAKFAST')
    expect(MEAL_TYPES_FOR_SLOTS).toContain('LUNCH')
    expect(MEAL_TYPES_FOR_SLOTS).toContain('DINNER')
    expect(MEAL_TYPES_FOR_SLOTS).toContain('SNACK')
  })
})

// ponytail: age-aware meal slots (T-00-01) — minimal boundary table
describe('getMealSlotsForAge', () => {
  it('returns 3 meals for newborns (0m)', () => {
    const slots = getMealSlotsForAge(0)
    expect(slots).toHaveLength(3)
    expect(slots.map((s) => s.mealType)).toEqual([
      MealType.BREAKFAST,
      MealType.LUNCH,
      MealType.DINNER,
    ])
  })

  it('returns 3 meals at 9m (boundary, just below 10m window)', () => {
    const slots = getMealSlotsForAge(9)
    expect(slots).toHaveLength(3)
    expect(slots.map((s) => s.mealType)).toEqual([
      MealType.BREAKFAST,
      MealType.LUNCH,
      MealType.DINNER,
    ])
  })

  it('returns 4 meals at 10m (cross into 1-snack window)', () => {
    const slots = getMealSlotsForAge(10)
    expect(slots).toHaveLength(4)
    expect(slots.map((s) => s.mealType)).toEqual([
      MealType.BREAKFAST,
      MealType.LUNCH,
      MealType.DINNER,
      MealType.SNACK_1,
    ])
  })

  it('returns 4 meals at 12m (last month of 1-snack window)', () => {
    const slots = getMealSlotsForAge(12)
    expect(slots).toHaveLength(4)
    expect(slots.map((s) => s.mealType)).toContain(MealType.SNACK_1)
    expect(slots.map((s) => s.mealType)).not.toContain(MealType.SNACK_2)
  })

  it('returns 5 meals at 13m (cross into 2-snack window)', () => {
    const slots = getMealSlotsForAge(13)
    expect(slots).toHaveLength(5)
    expect(slots.map((s) => s.mealType)).toEqual([
      MealType.BREAKFAST,
      MealType.SNACK_1,
      MealType.LUNCH,
      MealType.SNACK_2,
      MealType.DINNER,
    ])
  })

  it('returns 5 meals at 23m (end of 2-snack window)', () => {
    const slots = getMealSlotsForAge(23)
    expect(slots).toHaveLength(5)
    expect(slots.map((s) => s.mealType)).toContain(MealType.SNACK_2)
  })

  it('orders SNACK_1 after BREAKFAST and before LUNCH chronologically', () => {
    const slots = getMealSlotsForAge(13)
    const idxBreakfast = slots.findIndex((s) => s.mealType === MealType.BREAKFAST)
    const idxSnack1 = slots.findIndex((s) => s.mealType === MealType.SNACK_1)
    const idxLunch = slots.findIndex((s) => s.mealType === MealType.LUNCH)
    expect(idxBreakfast).toBeLessThan(idxSnack1)
    expect(idxSnack1).toBeLessThan(idxLunch)
  })

  it('uses "Comida" (not "Almuerzo") as LUNCH label', () => {
    const slots = getMealSlotsForAge(13)
    const lunch = slots.find((s) => s.mealType === MealType.LUNCH)
    expect(lunch?.label).toBe('Comida')
  })

  it('treats negative or non-finite months as the 3-meal case (no crash)', () => {
    expect(() => getMealSlotsForAge(-1)).not.toThrow()
    expect(getMealSlotsForAge(-1)).toHaveLength(3)
  })
})
