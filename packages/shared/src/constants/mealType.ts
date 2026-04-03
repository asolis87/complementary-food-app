/**
 * Meal type and day mappings for the Weekly Menu Planner.
 * Maps frontend Spanish keys to backend MealType enum values and day indices.
 */

import { MealType } from '../types/diary.js'

/** Frontend meal keys used in the UI (Spanish) */
export type MealKey = 'desayuno' | 'comida' | 'cena' | 'snack1' | 'snack2' | 'snack'

/** Frontend day keys used in the UI (Spanish abbreviations) */
export type DayKey = 'lun' | 'mar' | 'mie' | 'jue' | 'vie' | 'sab' | 'dom'

/**
 * Maps frontend meal keys to Prisma MealType enum values.
 * Used when converting UI selections to API payloads.
 */
export const MEAL_KEY_TO_TYPE: Record<MealKey, MealType> = {
  desayuno: MealType.BREAKFAST,
  comida: MealType.LUNCH,
  cena: MealType.DINNER,
  snack1: MealType.SNACK_1,
  snack2: MealType.SNACK_2,
  snack: MealType.SNACK,
} as const

/**
 * Reverse mapping: MealType enum to frontend meal keys.
 * Used when converting API responses to UI display.
 */
export const MEAL_TYPE_TO_KEY: Record<MealType, MealKey> = {
  [MealType.BREAKFAST]: 'desayuno',
  [MealType.LUNCH]: 'comida',
  [MealType.DINNER]: 'cena',
  [MealType.SNACK_1]: 'snack1',
  [MealType.SNACK_2]: 'snack2',
  [MealType.SNACK]: 'snack',
} as const

/**
 * Maps frontend day keys to day of week indices.
 * 0 = Monday, 6 = Sunday (ISO-8601)
 */
export const DAY_KEY_TO_INDEX: Record<DayKey, number> = {
  lun: 0,
  mar: 1,
  mie: 2,
  jue: 3,
  vie: 4,
  sab: 5,
  dom: 6,
} as const

/**
 * Reverse mapping: day indices to frontend day keys.
 */
export const DAY_INDEX_TO_KEY: Record<number, DayKey> = {
  0: 'lun',
  1: 'mar',
  2: 'mie',
  3: 'jue',
  4: 'vie',
  5: 'sab',
  6: 'dom',
} as const

/**
 * Active meal types currently shown in the UI.
 * The MenuWeekPage component uses these 3 meal slots per day.
 */
export const ACTIVE_MEAL_KEYS: MealKey[] = ['desayuno', 'comida', 'cena'] as const

/**
 * All day keys in order (Monday to Sunday).
 */
export const DAY_KEYS: DayKey[] = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'] as const
