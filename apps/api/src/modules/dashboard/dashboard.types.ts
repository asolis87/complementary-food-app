/**
 * Internal types for the dashboard module.
 *
 * These are used within the dashboard service layer — they are NOT
 * part of the public @pakulab/shared API.
 */

import type { FoodGroup } from '@pakulab/shared'
import type { MealType } from '@pakulab/shared'

/** Food data needed for suggestion sorting */
export interface FoodForSuggestion {
  id: string
  name: string
  group: FoodGroup
  alClassification: string
  ageMonths: number
  isAllergen: boolean
  allergenType: string | null
  isIronRich: boolean
  warningTags?: string[]
}

/** A food log entry with its associated food data */
export interface FoodLogWithFood {
  id: string
  userId: string
  babyProfileId: string
  foodId: string
  date: Date
  time: string | null
  mealType: MealType
  reaction: string | null
  notes: string | null
  food: {
    id: string
    name: string
    group: FoodGroup
    alClassification: string
    isAllergen: boolean
    allergenType: string | null
  }
}

/** Aggregated group stats for roadmap calculation */
export interface GroupStats {
  group: FoodGroup
  triedCount: number
  totalCount: number
}

/** Food + reaction info for roadmap enrichment */
export interface FoodWithReaction {
  foodId: string
  name: string
  reaction: string | null
  date: Date
}
