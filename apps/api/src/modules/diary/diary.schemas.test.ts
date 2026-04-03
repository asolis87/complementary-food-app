/**
 * Unit tests for diary Zod schemas.
 *
 * Validates that createLogSchema, updateLogSchema, and foodHistoryQuerySchema
 * enforce all required/optional fields and enum constraints.
 *
 * Spec: REQ-LOG-02 — plateBalanceLabel enum-validated snapshot.
 * Spec: Plato↔Bitácora Connection — API Contract foodHistoryQuerySchema.
 */

import { describe, it, expect } from 'vitest'
import { createLogSchema, updateLogSchema, foodHistoryQuerySchema } from './diary.schemas.js'
import { MealType, ReactionType } from '@pakulab/shared'

// Valid CUIDs for use in tests (cjld2cjxh0000qzrmn831i7rn format)
const VALID_CUID_1 = 'clh3x7y8z0000p6rm5b4d8e9f'
const VALID_CUID_2 = 'clh3x7y8z0001p6rm5b4d8e9f'
const VALID_CUID_3 = 'clh3x7y8z0002p6rm5b4d8e9f'
const VALID_BABY_CUID = 'clh3x7y8z0003p6rm5b4d8e9f'

// ──────────────────────────────────────────────────────────────────────────────
// createLogSchema
// ──────────────────────────────────────────────────────────────────────────────

describe('createLogSchema', () => {
  const validBase = {
    babyProfileId: 'baby-123',
    foodId: 'food-456',
    date: '2024-06-15',
    mealType: MealType.BREAKFAST,
  }

  it('accepts a valid minimal payload (no optional fields)', () => {
    const result = createLogSchema.safeParse(validBase)
    expect(result.success).toBe(true)
  })

  it('accepts a valid payload with all fields present', () => {
    const result = createLogSchema.safeParse({
      ...validBase,
      time: '08:30',
      reaction: ReactionType.LIKED,
      notes: 'Loved it',
      plateId: 'plate-789',
      plateBalanceLabel: 'BALANCED',
    })
    expect(result.success).toBe(true)
  })

  it('accepts a payload without reaction field (reaction is optional)', () => {
    const result = createLogSchema.safeParse({
      ...validBase,
      notes: 'No reaction recorded',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.reaction).toBeUndefined()
    }
  })

  it('accepts a payload with plateBalanceLabel set', () => {
    const result = createLogSchema.safeParse({
      ...validBase,
      plateBalanceLabel: 'SLIGHTLY_ASTRINGENT',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.plateBalanceLabel).toBe('SLIGHTLY_ASTRINGENT')
    }
  })

  it('accepts all valid plateBalanceLabel values', () => {
    const labels = [
      'BALANCED',
      'SLIGHTLY_ASTRINGENT',
      'VERY_ASTRINGENT',
      'SLIGHTLY_LAXATIVE',
      'VERY_LAXATIVE',
    ] as const
    for (const label of labels) {
      const result = createLogSchema.safeParse({ ...validBase, plateBalanceLabel: label })
      expect(result.success, `Expected ${label} to be valid`).toBe(true)
    }
  })

  it('rejects an invalid plateBalanceLabel value (enum-validated)', () => {
    const result = createLogSchema.safeParse({
      ...validBase,
      plateBalanceLabel: 'UNKNOWN_VALUE',
    })
    expect(result.success).toBe(false)
  })

  it('rejects a payload missing required field babyProfileId', () => {
    const { babyProfileId, ...withoutBabyProfileId } = validBase
    const result = createLogSchema.safeParse(withoutBabyProfileId)
    expect(result.success).toBe(false)
  })

  it('rejects a payload missing required field foodId', () => {
    const { foodId, ...withoutFoodId } = validBase
    const result = createLogSchema.safeParse(withoutFoodId)
    expect(result.success).toBe(false)
  })

  it('rejects a payload missing required field date', () => {
    const { date, ...withoutDate } = validBase
    const result = createLogSchema.safeParse(withoutDate)
    expect(result.success).toBe(false)
  })

  it('rejects a payload missing required field mealType', () => {
    const { mealType, ...withoutMealType } = validBase
    const result = createLogSchema.safeParse(withoutMealType)
    expect(result.success).toBe(false)
  })

  it('rejects an invalid date format', () => {
    const result = createLogSchema.safeParse({
      ...validBase,
      date: '15-06-2024', // wrong format
    })
    expect(result.success).toBe(false)
  })

  it('rejects an invalid time format', () => {
    const result = createLogSchema.safeParse({
      ...validBase,
      time: '8:30', // missing leading zero
    })
    expect(result.success).toBe(false)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// updateLogSchema
// ──────────────────────────────────────────────────────────────────────────────

describe('updateLogSchema', () => {
  it('accepts {reaction: "LIKED"}', () => {
    const result = updateLogSchema.safeParse({ reaction: ReactionType.LIKED })
    expect(result.success).toBe(true)
  })

  it('accepts {accepted: true}', () => {
    const result = updateLogSchema.safeParse({ accepted: true })
    expect(result.success).toBe(true)
  })

  it('accepts {notes: "test"}', () => {
    const result = updateLogSchema.safeParse({ notes: 'test' })
    expect(result.success).toBe(true)
  })

  it('accepts {reaction: null} — clear reaction to null', () => {
    const result = updateLogSchema.safeParse({ reaction: null })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.reaction).toBeNull()
    }
  })

  it('accepts {accepted: null} — clear accepted to null', () => {
    const result = updateLogSchema.safeParse({ accepted: null })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.accepted).toBeNull()
    }
  })

  it('accepts {notes: null} — clear notes to null', () => {
    const result = updateLogSchema.safeParse({ notes: null })
    expect(result.success).toBe(true)
  })

  it('rejects empty object {} — refine requires at least one field', () => {
    const result = updateLogSchema.safeParse({})
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('At least one field must be provided')
    }
  })

  it('rejects notes longer than 500 characters', () => {
    const result = updateLogSchema.safeParse({ notes: 'a'.repeat(501) })
    expect(result.success).toBe(false)
  })

  it('accepts notes exactly 500 characters (boundary)', () => {
    const result = updateLogSchema.safeParse({ notes: 'a'.repeat(500) })
    expect(result.success).toBe(true)
  })

  it('accepts all three fields together', () => {
    const result = updateLogSchema.safeParse({
      reaction: ReactionType.DISLIKED,
      accepted: false,
      notes: 'Did not eat it',
    })
    expect(result.success).toBe(true)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// foodHistoryQuerySchema
// ──────────────────────────────────────────────────────────────────────────────

describe('foodHistoryQuerySchema', () => {
  it('accepts a valid query with babyProfileId (CUID) and single foodId (CUID)', () => {
    const result = foodHistoryQuerySchema.safeParse({
      babyProfileId: VALID_BABY_CUID,
      foodIds: VALID_CUID_1,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.babyProfileId).toBe(VALID_BABY_CUID)
      expect(result.data.foodIds).toEqual([VALID_CUID_1])
    }
  })

  it('accepts a valid query with multiple comma-separated CUIDs', () => {
    const result = foodHistoryQuerySchema.safeParse({
      babyProfileId: VALID_BABY_CUID,
      foodIds: `${VALID_CUID_1},${VALID_CUID_2},${VALID_CUID_3}`,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.foodIds).toEqual([VALID_CUID_1, VALID_CUID_2, VALID_CUID_3])
    }
  })

  it('trims whitespace from individual foodIds', () => {
    const result = foodHistoryQuerySchema.safeParse({
      babyProfileId: VALID_BABY_CUID,
      foodIds: `${VALID_CUID_1}, ${VALID_CUID_2} , ${VALID_CUID_3}`,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.foodIds).toEqual([VALID_CUID_1, VALID_CUID_2, VALID_CUID_3])
    }
  })

  it('rejects a query missing babyProfileId', () => {
    const result = foodHistoryQuerySchema.safeParse({
      foodIds: VALID_CUID_1,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0])
      expect(paths).toContain('babyProfileId')
    }
  })

  it('rejects a query missing foodIds', () => {
    const result = foodHistoryQuerySchema.safeParse({
      babyProfileId: VALID_BABY_CUID,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0])
      expect(paths).toContain('foodIds')
    }
  })

  it('rejects an empty foodIds string', () => {
    const result = foodHistoryQuerySchema.safeParse({
      babyProfileId: VALID_BABY_CUID,
      foodIds: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects an empty babyProfileId string', () => {
    const result = foodHistoryQuerySchema.safeParse({
      babyProfileId: '',
      foodIds: VALID_CUID_1,
    })
    expect(result.success).toBe(false)
  })

  it('rejects a non-CUID babyProfileId', () => {
    const result = foodHistoryQuerySchema.safeParse({
      babyProfileId: 'not-a-cuid',
      foodIds: VALID_CUID_1,
    })
    expect(result.success).toBe(false)
  })

  it('rejects non-CUID foodIds — plain strings are rejected', () => {
    const result = foodHistoryQuerySchema.safeParse({
      babyProfileId: VALID_BABY_CUID,
      foodIds: 'food-456',
    })
    expect(result.success).toBe(false)
  })

  it('rejects a mix of valid CUIDs and invalid IDs', () => {
    const result = foodHistoryQuerySchema.safeParse({
      babyProfileId: VALID_BABY_CUID,
      foodIds: `${VALID_CUID_1},not-a-cuid,${VALID_CUID_2}`,
    })
    expect(result.success).toBe(false)
  })

  it('rejects more than 50 foodIds', () => {
    // Use one valid CUID pattern repeated (will fail CUID format anyway but tests max limit)
    const foodIds = Array.from({ length: 51 }, () => VALID_CUID_1).join(',')
    const result = foodHistoryQuerySchema.safeParse({
      babyProfileId: VALID_BABY_CUID,
      foodIds,
    })
    expect(result.success).toBe(false)
  })

  it('accepts exactly 50 CUIDs (boundary)', () => {
    // Generate 50 unique CUID-like strings (using the same valid CUID — Zod only checks format)
    const cuids = Array.from({ length: 50 }, (_, i) => {
      // Vary last digit to ensure uniqueness in the array
      const suffix = i.toString().padStart(2, '0')
      return `clh3x7y8z${suffix}00p6rm5b4d8e9f`
    })
    const result = foodHistoryQuerySchema.safeParse({
      babyProfileId: VALID_BABY_CUID,
      foodIds: cuids.join(','),
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.foodIds).toHaveLength(50)
    }
  })
})
