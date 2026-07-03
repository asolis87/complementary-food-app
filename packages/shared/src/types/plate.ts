/**
 * Plate entity types and enums for Pakulab.
 * These mirror the Prisma schema enums for use on the frontend too.
 */

import type { FoodGroup, ALClassification, Food, WarningTag } from './food.js'

/** Plate stage — target age range for a plate composition (REQ-C1) */
export const PLATE_STAGES = [
  'SIX_TO_NINE_MONTHS',
  'TEN_TO_TWELVE_MONTHS',
  'THIRTEEN_TO_TWENTY_THREE_MONTHS',
  'FAMILY_TABLE',
] as const

export type PlateStage = (typeof PLATE_STAGES)[number]

/** Human-readable Spanish (es-MX tuteo) labels for plate stages */
export const PLATE_STAGE_LABELS: Record<PlateStage, string> = {
  SIX_TO_NINE_MONTHS: '6-9 meses',
  TEN_TO_TWELVE_MONTHS: '10-12 meses',
  THIRTEEN_TO_TWENTY_THREE_MONTHS: '13-23 meses',
  FAMILY_TABLE: 'Mesa familiar (24m+)',
}

/**
 * Pure, deterministic age-to-groupCount suggestion (REQ-A2).
 * @param ageMonths - Baby age in months
 * @returns 4 if age < 10 months, 5 otherwise
 */
export function getSuggestedGroupCount(ageMonths: number): 4 | 5 {
  return ageMonths < 10 ? 4 : 5
}

/**
 * Pure, deterministic age-to-PlateStage mapping (REQ-C4 helper).
 * Used for default stage filter in PlateListPage.
 * @param ageMonths - Baby age in months
 * @returns PlateStage matching the baby's current stage
 */
export function getSuggestedStageForAge(ageMonths: number): PlateStage {
  if (ageMonths < 10) return 'SIX_TO_NINE_MONTHS'
  if (ageMonths < 13) return 'TEN_TO_TWELVE_MONTHS'
  if (ageMonths < 24) return 'THIRTEEN_TO_TWENTY_THREE_MONTHS'
  return 'FAMILY_TABLE'
}

/** PlateItem as returned by the API */
export interface PlateItem {
  id: string
  plateId: string
  foodId: string
  groupAssignment: FoodGroup
  servingAmount: string | null
  createdAt: string
  food?: Food
}

/** Minimal PlateItem data for display */
export interface PlateItemSummary {
  id: string
  foodId: string
  groupAssignment: FoodGroup
  servingAmount: string | null
  food?: {
    id: string
    name: string
    group: FoodGroup
    alClassification: ALClassification
    ageMonths: number
    isAllergen: boolean
    allergenType?: string | null
    warningTags: readonly WarningTag[]
  }
}

/** Plate as returned by the API */
export interface Plate {
  id: string
  userId: string
  babyProfileId: string | null
  name: string
  groupCount: 4 | 5
  stageFor: PlateStage | null
  balanceScore: number
  astringentCount: number
  laxativeCount: number
  neutralCount: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  items?: PlateItem[]
}

/** Input for creating a new plate */
export interface CreatePlateInput {
  name: string
  groupCount: 4 | 5
  babyProfileId?: string
  stageFor?: PlateStage
  items: Array<{
    foodId: string
    groupAssignment: FoodGroup
    servingAmount?: string
  }>
}

/** Input for updating an existing plate */
export interface UpdatePlateInput {
  name?: string
  groupCount?: 4 | 5
  babyProfileId?: string | null
  stageFor?: PlateStage
  items?: Array<{
    foodId: string
    groupAssignment: FoodGroup
    servingAmount?: string
  }>
}
