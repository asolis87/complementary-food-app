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
} from './dashboard.js'

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
