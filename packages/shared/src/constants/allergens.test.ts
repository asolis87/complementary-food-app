/**
 * @file allergens.test.ts
 * Tests for allergen constants — T-03-04 (ALLERGEN_TYPE_MAPPING move).
 */

import { describe, it, expect } from 'vitest'
import { TOP_ALLERGENS, ALLERGEN_KEYS, ALLERGEN_INTRO_WAIT_DAYS, ALLERGEN_TYPE_MAPPING } from './allergens'

describe('T-03-04: ALLERGEN_TYPE_MAPPING in shared', () => {
  it('should export ALLERGEN_TYPE_MAPPING constant', () => {
    expect(ALLERGEN_TYPE_MAPPING).toBeDefined()
    expect(typeof ALLERGEN_TYPE_MAPPING).toBe('object')
  })

  it('should have exactly 9 allergen type mappings', () => {
    const keys = Object.keys(ALLERGEN_TYPE_MAPPING)
    expect(keys).toHaveLength(9)
  })

  it('should map English allergen keys to Spanish seed allergenType values', () => {
    expect(ALLERGEN_TYPE_MAPPING['dairy']).toBe('leche')
    expect(ALLERGEN_TYPE_MAPPING['egg']).toBe('huevo')
    expect(ALLERGEN_TYPE_MAPPING['peanut']).toBe('cacahuate')
    expect(ALLERGEN_TYPE_MAPPING['fish']).toBe('pescado')
    expect(ALLERGEN_TYPE_MAPPING['shellfish']).toBe('mariscos')
    expect(ALLERGEN_TYPE_MAPPING['soy']).toBe('soya')
    expect(ALLERGEN_TYPE_MAPPING['gluten']).toBe('gluten')
    expect(ALLERGEN_TYPE_MAPPING['tree_nuts']).toBe('nueces')
    expect(ALLERGEN_TYPE_MAPPING['sesame']).toBe('ajonjoli')
  })

  it('should NOT include celery (explicit exclusion)', () => {
    expect(ALLERGEN_TYPE_MAPPING['celery']).toBeUndefined()
  })

  it('should have unique Spanish values (no duplicates)', () => {
    const values = Object.values(ALLERGEN_TYPE_MAPPING)
    const uniqueValues = new Set(values)
    expect(values.length).toBe(uniqueValues.size)
  })

  it('should align with TOP_ALLERGENS keys', () => {
    // TOP_ALLERGENS has 10 entries (includes mostaza)
    // ALLERGEN_TYPE_MAPPING has 9 entries (seed allergenType values)
    // All ALLERGEN_TYPE_MAPPING values should be in TOP_ALLERGENS.key
    const topKeys = TOP_ALLERGENS.map((a) => a.key)
    const mappingValues = Object.values(ALLERGEN_TYPE_MAPPING)

    mappingValues.forEach((spanishKey) => {
      expect(topKeys).toContain(spanishKey)
    })
  })
})

describe('Existing allergen constants (regression)', () => {
  it('should export TOP_ALLERGENS with 10 items', () => {
    expect(TOP_ALLERGENS).toHaveLength(10)
  })

  it('should export ALLERGEN_KEYS array', () => {
    expect(ALLERGEN_KEYS).toHaveLength(10)
  })

  it('should export ALLERGEN_INTRO_WAIT_DAYS = 3', () => {
    expect(ALLERGEN_INTRO_WAIT_DAYS).toBe(3)
  })
})
