/**
 * Weekly Menu Planner types for Pakulab.
 * These mirror the Prisma schema for use on both the API and the frontend.
 */

import type { MealType } from './diary.js'
import type { Plate, PlateItemSummary } from './plate.js'

/** A single meal slot within a day */
export interface MenuMealResponse {
  id: string
  menuDayId: string
  mealType: MealType
  plateId: string | null
  notes: string | null
  servedAt?: string | null // ISO timestamp when meal was served
  plate?: (Plate & { items?: PlateItemSummary[] }) | null // Populated when fetching menu details
}

/** A day within the weekly menu */
export interface MenuDayResponse {
  id: string
  menuId: string
  dayOfWeek: number // 0 = Monday, 6 = Sunday
  createdAt: string
  meals: MenuMealResponse[]
}

/** Full weekly menu response with nested days and meals */
export interface WeeklyMenuResponse {
  id: string
  userId: string
  babyProfileId: string
  weekStart: string // ISO date YYYY-MM-DD
  balanceScore: number | null // Computed: avg of all assigned plate scores
  createdAt: string
  updatedAt: string
  days: MenuDayResponse[]
}

/** Payload for PATCH /api/menus/:menuId/meals — upsert or clear a meal slot */
export interface MealSlotPatch {
  dayOfWeek: number // 0-6
  mealType: MealType
  plateId: string | null // null = clear the slot
  notes?: string
}

/** Payload for POST /api/menus — create a new weekly menu */
export interface CreateMenuPayload {
  babyProfileId: string
  weekStart: string // ISO date YYYY-MM-DD, must be Monday
  name?: string
}

/** Payload for POST /api/menus/:menuId/serve — serve a meal */
export interface ServeMealPayload {
  dayOfWeek: number // 0-6 (Monday = 0, Sunday = 6)
  mealType: MealType
  babyProfileId: string
  force?: boolean // If true, allow re-serving an already-served meal
}

/** Response from POST /api/menus/:menuId/serve */
export interface ServeMealResponse {
  servedAt: string // ISO timestamp
  entriesCount: number // Number of FoodLog entries created
  replacedCount?: number // Only present on re-serve (when force=true)
}
