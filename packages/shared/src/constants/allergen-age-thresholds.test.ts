/**
 * Unit tests for allergen age thresholds.
 *
 * Spec: REQ-DASH-BIZ-02 (Allergen Window Logic)
 */

import { describe, it, expect } from 'vitest'
import { ALLERGEN_AGE_THRESHOLDS, DEFAULT_ALLERGEN_MIN_AGE_MONTHS, CLOSING_WINDOW_AGE_MONTHS } from './allergen-age-thresholds.js'

describe('ALLERGEN_AGE_THRESHOLDS', () => {
  it('is an array of allergen threshold entries', () => {
    expect(Array.isArray(ALLERGEN_AGE_THRESHOLDS)).toBe(true)
    expect(ALLERGEN_AGE_THRESHOLDS.length).toBeGreaterThanOrEqual(9)
  })

  it('each entry has allergenKey, nameEs, icon, and minAgeMonths', () => {
    for (const entry of ALLERGEN_AGE_THRESHOLDS) {
      expect(entry).toHaveProperty('allergenKey')
      expect(entry).toHaveProperty('nameEs')
      expect(entry).toHaveProperty('icon')
      expect(entry).toHaveProperty('minAgeMonths')
      expect(typeof entry.allergenKey).toBe('string')
      expect(typeof entry.nameEs).toBe('string')
      expect(typeof entry.icon).toBe('string')
      expect(typeof entry.minAgeMonths).toBe('number')
      expect(entry.minAgeMonths).toBeGreaterThanOrEqual(6)
    }
  })

  it('covers the 9 common allergens', () => {
    const keys = ALLERGEN_AGE_THRESHOLDS.map((e) => e.allergenKey)
    expect(keys).toContain('leche')
    expect(keys).toContain('huevo')
    expect(keys).toContain('cacahuate')
    expect(keys).toContain('pescado')
    expect(keys).toContain('soya')
    expect(keys).toContain('gluten')
    expect(keys).toContain('nueces')
    expect(keys).toContain('ajonjoli')
    expect(keys).toContain('mostaza')
  })

  it('has correct min age for high-priority allergens', () => {
    const huevo = ALLERGEN_AGE_THRESHOLDS.find((e) => e.allergenKey === 'huevo')
    const cacahuate = ALLERGEN_AGE_THRESHOLDS.find((e) => e.allergenKey === 'cacahuate')
    expect(huevo?.minAgeMonths).toBe(6)
    expect(cacahuate?.minAgeMonths).toBe(6)
  })

  it('is a readonly array', () => {
    const first = ALLERGEN_AGE_THRESHOLDS[0]
    expect(first).toBeDefined()
    expect(first!.allergenKey).toBeTruthy()
  })
})

describe('DEFAULT_ALLERGEN_MIN_AGE_MONTHS', () => {
  it('is 6 months', () => {
    expect(DEFAULT_ALLERGEN_MIN_AGE_MONTHS).toBe(6)
  })
})

describe('CLOSING_WINDOW_AGE_MONTHS', () => {
  it('is 10 months', () => {
    expect(CLOSING_WINDOW_AGE_MONTHS).toBe(10)
  })
})
