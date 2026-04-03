/**
 * Unit tests for menus Zod schemas.
 *
 * Validates that getMenuQuerySchema, createMenuSchema, patchMealSchema,
 * and menuIdParamSchema enforce all validation rules correctly.
 *
 * Spec: REQ-MENU-01 — Pro-only weekly menu planner.
 * Spec: REQ-MENU-02 — weekStart must be a Monday.
 */

import { describe, it, expect } from 'vitest'
import {
  getMenuQuerySchema,
  createMenuSchema,
  patchMealSchema,
  menuIdParamSchema,
  serveMealSchema,
  serveMealQuerySchema,
} from './menus.schemas.js'
import { MealType } from '@pakulab/shared'

// Valid CUIDs for use in tests
const VALID_CUID_1 = 'clh3x7y8z0000p6rm5b4d8e9f'
const VALID_CUID_2 = 'clh3x7y8z0001p6rm5b4d8e9f'
const VALID_MENU_CUID = 'clh3x7y8z0002p6rm5b4d8e9f'
const VALID_PLATE_CUID = 'clh3x7y8z0003p6rm5b4d8e9f'

// Helper to get Monday of current week
function getMondayDate(): string {
  const now = new Date()
  const day = now.getDay() // 0 = Sunday, 1 = Monday, ...
  const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Adjust to get Monday
  const monday = new Date(now.setDate(diff))
  return monday.toISOString().split('T')[0]!
}

// Helper to get Sunday of current week
function getSundayDate(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day // Sunday
  const sunday = new Date(now.setDate(diff))
  return sunday.toISOString().split('T')[0]!
}

// ──────────────────────────────────────────────────────────────────────────────
// getMenuQuerySchema
// ──────────────────────────────────────────────────────────────────────────────

describe('getMenuQuerySchema', () => {
  const mondayDate = getMondayDate()

  it('accepts a valid query with CUID babyProfileId and Monday weekStart', () => {
    const result = getMenuQuerySchema.safeParse({
      babyProfileId: VALID_CUID_1,
      weekStart: mondayDate,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.babyProfileId).toBe(VALID_CUID_1)
      expect(result.data.weekStart).toBe(mondayDate)
    }
  })

  it('accepts any valid Monday date', () => {
    // Test a specific Monday: 2024-06-10 (was a Monday)
    const result = getMenuQuerySchema.safeParse({
      babyProfileId: VALID_CUID_1,
      weekStart: '2024-06-10',
    })
    expect(result.success).toBe(true)
  })

  it('rejects weekStart that is not a Monday (e.g., Sunday)', () => {
    // 2024-06-09 was a Sunday
    const result = getMenuQuerySchema.safeParse({
      babyProfileId: VALID_CUID_1,
      weekStart: '2024-06-09',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('weekStart must be a Monday')
    }
  })

  it('rejects weekStart that is not a Monday (e.g., Tuesday)', () => {
    // 2024-06-11 was a Tuesday
    const result = getMenuQuerySchema.safeParse({
      babyProfileId: VALID_CUID_1,
      weekStart: '2024-06-11',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('weekStart must be a Monday')
    }
  })

  it('rejects non-CUID babyProfileId', () => {
    const result = getMenuQuerySchema.safeParse({
      babyProfileId: 'not-a-cuid',
      weekStart: mondayDate,
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid weekStart format (not YYYY-MM-DD)', () => {
    const result = getMenuQuerySchema.safeParse({
      babyProfileId: VALID_CUID_1,
      weekStart: '06-10-2024', // Wrong format
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('weekStart must be YYYY-MM-DD format')
    }
  })

  it('rejects missing babyProfileId', () => {
    const result = getMenuQuerySchema.safeParse({
      weekStart: mondayDate,
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing weekStart', () => {
    const result = getMenuQuerySchema.safeParse({
      babyProfileId: VALID_CUID_1,
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty babyProfileId', () => {
    const result = getMenuQuerySchema.safeParse({
      babyProfileId: '',
      weekStart: mondayDate,
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty weekStart', () => {
    const result = getMenuQuerySchema.safeParse({
      babyProfileId: VALID_CUID_1,
      weekStart: '',
    })
    expect(result.success).toBe(false)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// createMenuSchema
// ──────────────────────────────────────────────────────────────────────────────

describe('createMenuSchema', () => {
  const mondayDate = getMondayDate()

  it('accepts a valid create payload with minimal fields', () => {
    const result = createMenuSchema.safeParse({
      babyProfileId: VALID_CUID_1,
      weekStart: mondayDate,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.babyProfileId).toBe(VALID_CUID_1)
      expect(result.data.weekStart).toBe(mondayDate)
      expect(result.data.name).toBeUndefined()
    }
  })

  it('accepts a valid create payload with optional name', () => {
    const result = createMenuSchema.safeParse({
      babyProfileId: VALID_CUID_1,
      weekStart: mondayDate,
      name: 'My Weekly Menu',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('My Weekly Menu')
    }
  })

  it('rejects weekStart that is not a Monday', () => {
    // 2024-06-12 was a Wednesday
    const result = createMenuSchema.safeParse({
      babyProfileId: VALID_CUID_1,
      weekStart: '2024-06-12',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('weekStart must be a Monday')
    }
  })

  it('rejects non-CUID babyProfileId', () => {
    const result = createMenuSchema.safeParse({
      babyProfileId: 'invalid-id',
      weekStart: mondayDate,
    })
    expect(result.success).toBe(false)
  })

  it('rejects name longer than 100 characters', () => {
    const result = createMenuSchema.safeParse({
      babyProfileId: VALID_CUID_1,
      weekStart: mondayDate,
      name: 'a'.repeat(101),
    })
    expect(result.success).toBe(false)
  })

  it('accepts name exactly 100 characters (boundary)', () => {
    const result = createMenuSchema.safeParse({
      babyProfileId: VALID_CUID_1,
      weekStart: mondayDate,
      name: 'a'.repeat(100),
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing babyProfileId', () => {
    const result = createMenuSchema.safeParse({
      weekStart: mondayDate,
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing weekStart', () => {
    const result = createMenuSchema.safeParse({
      babyProfileId: VALID_CUID_1,
    })
    expect(result.success).toBe(false)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// patchMealSchema
// ──────────────────────────────────────────────────────────────────────────────

describe('patchMealSchema', () => {
  it('accepts a valid payload with all required fields', () => {
    const result = patchMealSchema.safeParse({
      dayOfWeek: 0,
      mealType: MealType.BREAKFAST,
      plateId: VALID_PLATE_CUID,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.dayOfWeek).toBe(0)
      expect(result.data.mealType).toBe(MealType.BREAKFAST)
      expect(result.data.plateId).toBe(VALID_PLATE_CUID)
      expect(result.data.notes).toBeUndefined()
    }
  })

  it('accepts plateId as null (clear slot)', () => {
    const result = patchMealSchema.safeParse({
      dayOfWeek: 3,
      mealType: MealType.LUNCH,
      plateId: null,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.plateId).toBeNull()
    }
  })

  it('accepts all valid dayOfWeek values (0-6)', () => {
    for (let i = 0; i <= 6; i++) {
      const result = patchMealSchema.safeParse({
        dayOfWeek: i,
        mealType: MealType.DINNER,
        plateId: VALID_PLATE_CUID,
      })
      expect(result.success, `Expected dayOfWeek=${i} to be valid`).toBe(true)
    }
  })

  it('rejects dayOfWeek below 0', () => {
    const result = patchMealSchema.safeParse({
      dayOfWeek: -1,
      mealType: MealType.BREAKFAST,
      plateId: VALID_PLATE_CUID,
    })
    expect(result.success).toBe(false)
  })

  it('rejects dayOfWeek above 6', () => {
    const result = patchMealSchema.safeParse({
      dayOfWeek: 7,
      mealType: MealType.BREAKFAST,
      plateId: VALID_PLATE_CUID,
    })
    expect(result.success).toBe(false)
  })

  it('accepts all valid MealType enum values', () => {
    const mealTypes = [
      MealType.BREAKFAST,
      MealType.LUNCH,
      MealType.DINNER,
      MealType.SNACK_1,
      MealType.SNACK_2,
      MealType.SNACK,
    ]
    for (const mealType of mealTypes) {
      const result = patchMealSchema.safeParse({
        dayOfWeek: 1,
        mealType,
        plateId: VALID_PLATE_CUID,
      })
      expect(result.success, `Expected mealType=${mealType} to be valid`).toBe(true)
    }
  })

  it('rejects invalid mealType enum value', () => {
    const result = patchMealSchema.safeParse({
      dayOfWeek: 1,
      mealType: 'INVALID_TYPE',
      plateId: VALID_PLATE_CUID,
    })
    expect(result.success).toBe(false)
  })

  it('rejects non-CUID plateId', () => {
    const result = patchMealSchema.safeParse({
      dayOfWeek: 1,
      mealType: MealType.LUNCH,
      plateId: 'not-a-cuid',
    })
    expect(result.success).toBe(false)
  })

  it('accepts optional notes field', () => {
    const result = patchMealSchema.safeParse({
      dayOfWeek: 2,
      mealType: MealType.DINNER,
      plateId: VALID_PLATE_CUID,
      notes: 'Extra sauce on the side',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.notes).toBe('Extra sauce on the side')
    }
  })

  it('rejects notes longer than 500 characters', () => {
    const result = patchMealSchema.safeParse({
      dayOfWeek: 2,
      mealType: MealType.DINNER,
      plateId: VALID_PLATE_CUID,
      notes: 'a'.repeat(501),
    })
    expect(result.success).toBe(false)
  })

  it('accepts notes exactly 500 characters (boundary)', () => {
    const result = patchMealSchema.safeParse({
      dayOfWeek: 2,
      mealType: MealType.DINNER,
      plateId: VALID_PLATE_CUID,
      notes: 'a'.repeat(500),
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing dayOfWeek', () => {
    const result = patchMealSchema.safeParse({
      mealType: MealType.BREAKFAST,
      plateId: VALID_PLATE_CUID,
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing mealType', () => {
    const result = patchMealSchema.safeParse({
      dayOfWeek: 1,
      plateId: VALID_PLATE_CUID,
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing plateId', () => {
    const result = patchMealSchema.safeParse({
      dayOfWeek: 1,
      mealType: MealType.BREAKFAST,
    })
    expect(result.success).toBe(false)
  })

  it('rejects non-integer dayOfWeek', () => {
    const result = patchMealSchema.safeParse({
      dayOfWeek: 1.5,
      mealType: MealType.BREAKFAST,
      plateId: VALID_PLATE_CUID,
    })
    expect(result.success).toBe(false)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// menuIdParamSchema
// ──────────────────────────────────────────────────────────────────────────────

describe('menuIdParamSchema', () => {
  it('accepts a valid CUID menuId', () => {
    const result = menuIdParamSchema.safeParse({
      menuId: VALID_MENU_CUID,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.menuId).toBe(VALID_MENU_CUID)
    }
  })

  it('rejects non-CUID menuId', () => {
    const result = menuIdParamSchema.safeParse({
      menuId: 'invalid-menu-id',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty menuId', () => {
    const result = menuIdParamSchema.safeParse({
      menuId: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing menuId', () => {
    const result = menuIdParamSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('rejects UUID format (not CUID)', () => {
    const result = menuIdParamSchema.safeParse({
      menuId: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.success).toBe(false)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// serveMealSchema
// ──────────────────────────────────────────────────────────────────────────────

describe('serveMealSchema', () => {
  it('accepts a valid serve payload', () => {
    const result = serveMealSchema.safeParse({
      dayOfWeek: 0,
      mealType: MealType.LUNCH,
      babyProfileId: VALID_CUID_1,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.dayOfWeek).toBe(0)
      expect(result.data.mealType).toBe(MealType.LUNCH)
      expect(result.data.babyProfileId).toBe(VALID_CUID_1)
    }
  })

  it('accepts all valid dayOfWeek values (0-6)', () => {
    for (let i = 0; i <= 6; i++) {
      const result = serveMealSchema.safeParse({
        dayOfWeek: i,
        mealType: MealType.BREAKFAST,
        babyProfileId: VALID_CUID_1,
      })
      expect(result.success, `Expected dayOfWeek=${i} to be valid`).toBe(true)
    }
  })

  it('rejects dayOfWeek below 0 (negative)', () => {
    const result = serveMealSchema.safeParse({
      dayOfWeek: -1,
      mealType: MealType.BREAKFAST,
      babyProfileId: VALID_CUID_1,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('0-6')
    }
  })

  it('rejects dayOfWeek above 6', () => {
    const result = serveMealSchema.safeParse({
      dayOfWeek: 7,
      mealType: MealType.BREAKFAST,
      babyProfileId: VALID_CUID_1,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('0-6')
    }
  })

  it('rejects non-integer dayOfWeek', () => {
    const result = serveMealSchema.safeParse({
      dayOfWeek: 1.5,
      mealType: MealType.BREAKFAST,
      babyProfileId: VALID_CUID_1,
    })
    expect(result.success).toBe(false)
  })

  it('accepts all valid MealType enum values', () => {
    const mealTypes = [
      MealType.BREAKFAST,
      MealType.LUNCH,
      MealType.DINNER,
      MealType.SNACK_1,
      MealType.SNACK_2,
      MealType.SNACK,
    ]
    for (const mealType of mealTypes) {
      const result = serveMealSchema.safeParse({
        dayOfWeek: 1,
        mealType,
        babyProfileId: VALID_CUID_1,
      })
      expect(result.success, `Expected mealType=${mealType} to be valid`).toBe(true)
    }
  })

  it('rejects invalid mealType enum value', () => {
    const result = serveMealSchema.safeParse({
      dayOfWeek: 1,
      mealType: 'INVALID_TYPE',
      babyProfileId: VALID_CUID_1,
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing babyProfileId', () => {
    const result = serveMealSchema.safeParse({
      dayOfWeek: 1,
      mealType: MealType.BREAKFAST,
    })
    expect(result.success).toBe(false)
  })

  it('rejects non-CUID babyProfileId', () => {
    const result = serveMealSchema.safeParse({
      dayOfWeek: 1,
      mealType: MealType.BREAKFAST,
      babyProfileId: 'not-a-valid-cuid',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty babyProfileId', () => {
    const result = serveMealSchema.safeParse({
      dayOfWeek: 1,
      mealType: MealType.BREAKFAST,
      babyProfileId: '',
    })
    expect(result.success).toBe(false)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// serveMealQuerySchema
// ──────────────────────────────────────────────────────────────────────────────

describe('serveMealQuerySchema', () => {
  it('rejects boolean force=true (must be string)', () => {
    const result = serveMealQuerySchema.safeParse({
      force: true,
    })
    expect(result.success).toBe(false)
  })

  it('rejects boolean force=false (must be string)', () => {
    const result = serveMealQuerySchema.safeParse({
      force: false,
    })
    expect(result.success).toBe(false)
  })

  it('accepts force as string "true"', () => {
    const result = serveMealQuerySchema.safeParse({
      force: 'true',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.force).toBe(true)
    }
  })

  it('rejects force as string "false" (treated as undefined, defaults to false)', () => {
    const result = serveMealQuerySchema.safeParse({
      force: 'false',
    })
    // 'false' is not in enum ['true', '1'], so it's rejected
    expect(result.success).toBe(false)
  })

  it('defaults force to false when not provided', () => {
    const result = serveMealQuerySchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.force).toBe(false)
    }
  })

  it('coerces string "1" to true', () => {
    const result = serveMealQuerySchema.safeParse({
      force: '1',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.force).toBe(true)
    }
  })

  it('rejects force as string "0" (treated as undefined, defaults to false)', () => {
    const result = serveMealQuerySchema.safeParse({
      force: '0',
    })
    // '0' is not in enum ['true', '1'], so it's rejected
    expect(result.success).toBe(false)
  })
})
