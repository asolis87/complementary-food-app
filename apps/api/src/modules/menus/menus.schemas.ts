/**
 * Zod validation schemas for the menus (weekly menu planner) module.
 * Extracted for testability and reuse.
 *
 * Spec: REQ-MENU-01 — Pro-only weekly menu planner.
 */

import { z } from 'zod'
import { MealType } from '@pakulab/shared'

/**
 * Validates that a date string represents a Monday.
 * Uses UTC to avoid timezone issues with YYYY-MM-DD strings.
 * ISO-8601: Monday is day 1 (0 = Sunday, 1 = Monday, ... 6 = Saturday).
 */
const isMonday = (dateStr: string): boolean => {
  // Parse YYYY-MM-DD format manually to avoid timezone issues
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return false

  const [, yearStr, monthStr, dayStr] = match
  const year = parseInt(yearStr!, 10)
  const month = parseInt(monthStr!, 10) - 1 // 0-indexed
  const day = parseInt(dayStr!, 10)

  // Use UTC date to ensure consistent day-of-week regardless of timezone
  const date = new Date(Date.UTC(year, month, day))
  if (isNaN(date.getTime())) return false

  // getUTCDay(): 0 = Sunday, 1 = Monday, ... 6 = Saturday
  return date.getUTCDay() === 1
}

export const getMenuQuerySchema = z.object({
  babyProfileId: z.string().cuid(),
  weekStart: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'weekStart must be YYYY-MM-DD format')
    .refine(isMonday, {
      message: 'weekStart must be a Monday',
    }),
})

export const createMenuSchema = z.object({
  babyProfileId: z.string().cuid(),
  weekStart: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'weekStart must be YYYY-MM-DD format')
    .refine(isMonday, {
      message: 'weekStart must be a Monday',
    }),
  name: z.string().max(100).optional(),
})

export const patchMealSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  mealType: z.nativeEnum(MealType),
  plateId: z.string().cuid().nullable(), // null = remove plate from slot
  notes: z.string().max(500).optional(),
})

export const menuIdParamSchema = z.object({
  menuId: z.string().cuid(),
})

/**
 * Schema for serving a meal from the menu.
 * Converts the menu meal into FoodLog entries for the diary.
 */
export const serveMealSchema = z.object({
  dayOfWeek: z.number().int().min(0, 'dayOfWeek must be 0-6 (Monday=0, Sunday=6)').max(6, 'dayOfWeek must be 0-6 (Monday=0, Sunday=6)'),
  mealType: z.nativeEnum(MealType),
  babyProfileId: z.string().cuid(),
})

/**
 * Query params for serve endpoint.
 * force=true allows re-serving an already-served meal.
 * Only "true" or "1" are treated as true; "false" and "0" are treated as false.
 */
export const serveMealQuerySchema = z.object({
  force: z.enum(['true', '1']).optional().transform(val => val !== undefined),
})

export type GetMenuQueryInput = z.infer<typeof getMenuQuerySchema>
export type CreateMenuInput = z.infer<typeof createMenuSchema>
export type PatchMealInput = z.infer<typeof patchMealSchema>
export type MenuIdParamInput = z.infer<typeof menuIdParamSchema>
export type ServeMealInput = z.infer<typeof serveMealSchema>
export type ServeMealQueryInput = z.infer<typeof serveMealQuerySchema>
