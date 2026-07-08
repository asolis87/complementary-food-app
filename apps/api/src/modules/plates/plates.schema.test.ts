/**
 * @file plates.schema.test.ts
 * Unit tests for plate Zod validation schemas.
 */

import { describe, it, expect } from 'vitest'
import { createPlateSchema, updatePlateSchema, plateItemInputSchema, listPlatesQuerySchema } from './plates.schema'

describe('createPlateSchema', () => {
  it('should accept valid stageFor enum values', () => {
    const validStages = ['SIX_TO_NINE_MONTHS', 'TEN_TO_TWELVE_MONTHS', 'THIRTEEN_TO_TWENTY_THREE_MONTHS', 'FAMILY_TABLE']

    validStages.forEach((stage) => {
      const result = createPlateSchema.safeParse({
        name: 'Test Plate',
        groupCount: 4,
        stageFor: stage,
        items: [],
      })
      expect(result.success).toBe(true)
    })
  })

  it('should accept stageFor as optional (undefined)', () => {
    const result = createPlateSchema.safeParse({
      name: 'Test Plate',
      groupCount: 4,
      items: [],
    })
    expect(result.success).toBe(true)
  })

  it('should reject invalid stageFor enum values', () => {
    const result = createPlateSchema.safeParse({
      name: 'Test Plate',
      groupCount: 4,
      stageFor: 'INVALID_STAGE',
      items: [],
    })
    expect(result.success).toBe(false)
  })
})

describe('updatePlateSchema', () => {
  it('should accept valid stageFor enum values', () => {
    const result = updatePlateSchema.safeParse({
      stageFor: 'TEN_TO_TWELVE_MONTHS',
    })
    expect(result.success).toBe(true)
  })

  it('should accept stageFor as optional', () => {
    const result = updatePlateSchema.safeParse({
      name: 'Updated',
    })
    expect(result.success).toBe(true)
  })

  it('should reject invalid stageFor enum values', () => {
    const result = updatePlateSchema.safeParse({
      stageFor: 'NOT_A_STAGE',
    })
    expect(result.success).toBe(false)
  })
})

describe('listPlatesQuerySchema (stageFor filter)', () => {
  it('should accept a valid stageFor enum value', () => {
    const result = listPlatesQuerySchema.safeParse({ stageFor: 'TEN_TO_TWELVE_MONTHS' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.stageFor).toBe('TEN_TO_TWELVE_MONTHS')
  })

  it('should coerce the literal string "null" to null (the "Sin definir" filter)', () => {
    const result = listPlatesQuerySchema.safeParse({ stageFor: 'null' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.stageFor).toBeNull()
  })

  it('should coerce an empty string to null', () => {
    const result = listPlatesQuerySchema.safeParse({ stageFor: '' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.stageFor).toBeNull()
  })

  it('should leave stageFor undefined when absent (no filter)', () => {
    const result = listPlatesQuerySchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.stageFor).toBeUndefined()
  })

  it('should reject an invalid stageFor value', () => {
    const result = listPlatesQuerySchema.safeParse({ stageFor: 'NOT_A_STAGE' })
    expect(result.success).toBe(false)
  })
})

describe('plateItemInputSchema (servingAmount)', () => {
  it('should accept valid servingAmount values (1-4)', () => {
    const validAmounts = ['1', '2', '3', '4']

    validAmounts.forEach((amount) => {
      const result = plateItemInputSchema.safeParse({
        foodId: 'clv1234567890abcdefgh',
        groupAssignment: 'FRUIT',
        servingAmount: amount,
      })
      expect(result.success).toBe(true)
    })
  })

  it('should accept servingAmount as optional', () => {
    const result = plateItemInputSchema.safeParse({
      foodId: 'clv1234567890abcdefgh',
      groupAssignment: 'FRUIT',
    })
    expect(result.success).toBe(true)
  })

  it('should reject invalid servingAmount values', () => {
    const invalidAmounts = ['0', '5', 'abc', '10']

    invalidAmounts.forEach((amount) => {
      const result = plateItemInputSchema.safeParse({
        foodId: 'clv1234567890abcdefgh',
        groupAssignment: 'FRUIT',
        servingAmount: amount,
      })
      expect(result.success).toBe(false)
    })
  })
})
