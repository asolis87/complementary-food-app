/**
 * Plate entity types — the core of the plate builder feature.
 */

import type { FoodGroup, FoodSummary, ALClassification } from './food.js'

/** A plate item — a food placed in a specific group on the plate */
export interface PlateItem {
  id: string
  plateId: string
  foodId: string
  groupAssignment: FoodGroup // Which plate section this food is in
  food?: FoodSummary // Populated when fetching plate details
}

/** Minimal plate item summary for menu meal responses (includes essential food details) */
export interface PlateItemSummary {
  id: string
  foodId: string
  groupAssignment: FoodGroup
  food?: {
    id: string
    name: string
    group: FoodGroup
    alClassification: ALClassification
    isAllergen: boolean
  }
}

/** A saved plate */
export interface Plate {
  id: string
  userId: string
  babyProfileId?: string
  name: string
  groupCount: 4 | 5 // 4 base groups, or 5 with healthy fats enabled
  balanceScore: number // -1.0 to +1.0
  astringentCount: number
  laxativeCount: number
  neutralCount: number
  createdAt: string
  updatedAt: string
  deletedAt?: string
  items?: PlateItem[]
}

/** Plate creation payload */
export interface CreatePlateInput {
  name?: string
  groupCount?: 4 | 5
  babyProfileId?: string
  items: Array<{
    foodId: string
    groupAssignment: FoodGroup
  }>
}

/** Plate update payload */
export interface UpdatePlateInput {
  name?: string
  groupCount?: 4 | 5
  babyProfileId?: string
  items?: Array<{
    foodId: string
    groupAssignment: FoodGroup
  }>
}
