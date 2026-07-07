/**
 * Snack types — reusable snack entities (Colaciones).
 * REQ-SM1: Snack entity shape.
 */

import type { FoodGroup } from './food.js'
import type { PlateStage } from './plate.js'

/**
 * Snack item — a single food in a snack, with group assignment.
 * Similar to PlateItem but for snacks (no balance scoring).
 */
export interface SnackItem {
  id: string
  snackId: string
  foodId: string
  groupAssignment: FoodGroup // app-validated: HEALTHY_FAT | CEREAL_TUBER | FRUIT
  servingAmount?: string | null
  createdAt: string
}

/**
 * Snack item summary — includes the food details.
 */
export interface SnackItemSummary extends SnackItem {
  food: {
    id: string
    name: string
    group: FoodGroup
  }
}

/**
 * Snack — a reusable snack entity.
 * Unlike Plates, Snacks have NO balanceScore, groupCount, or A/L counters.
 */
export interface Snack {
  id: string
  userId: string
  babyProfileId?: string | null
  name: string
  stageFor?: PlateStage | null
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
  items: SnackItemSummary[]
}

/**
 * Input for creating a snack.
 * REQ-SM2: Create snack via manual per-group selection.
 */
export interface CreateSnackInput {
  name?: string
  babyProfileId?: string | null
  stageFor?: PlateStage | null
  items: {
    foodId: string
    groupAssignment: FoodGroup
    servingAmount?: string
  }[]
}
