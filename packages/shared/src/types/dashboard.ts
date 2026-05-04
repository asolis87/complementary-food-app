/**
 * Dashboard types for Pakulab.
 *
 * Provides consolidated data for the actionable dashboard view,
 * aggregating diary, foods, profiles, and allergen modules.
 *
 * Spec: REQ-DASH-01 through REQ-DASH-06
 */

import type { FoodGroup } from './food.js'
import type { MealType, ReactionType } from './diary.js'

// ── Dashboard Consolidated ────────────────────────────────────────────────────

/** Consolidated dashboard response — GET /api/dashboard */
export interface DashboardData {
  baby: BabyContext
  userTier: 'FREE' | 'PRO'
  todayLogs: TodayLog[]
  suggestedFoods: SuggestedFood[]
  pendingAllergens: AllergenAlert[]
  roadmapProgress: RoadmapProgress[]
  weeklyBalance: BalanceInsight
}

// ── Baby Context ──────────────────────────────────────────────────────────────

/** Baby context shown in the header */
export interface BabyContext {
  id: string
  name: string
  ageInMonths: number
  daysInAC: number
}

// ── Today's Logs ──────────────────────────────────────────────────────────────

/** A single food log entry for today */
export interface TodayLog {
  id: string
  mealType: MealType
  time: string | null // HH:mm
  foodId: string
  foodName: string
  foodGroup: FoodGroup
  reaction: ReactionType | null
  notes: string | null
}

// ── Food Suggestions ──────────────────────────────────────────────────────────

/** A food suggestion based on age + history */
export interface SuggestedFood {
  foodId: string
  name: string
  group: FoodGroup
  ageMonths: number
  benefit: string // e.g. "Alto en proteína"
  isAllergen: boolean
  allergenType: string | null
  status: 'pending' | 'tried' | 'rejected'
}

// ── Allergen Alerts ───────────────────────────────────────────────────────────

/** A pending allergen to introduce */
export interface AllergenAlert {
  allergenKey: string // matches Food.allergenType
  nameEs: string // e.g. "Huevo"
  icon: string // emoji
  minAgeMonths: number
  urgency: 'normal' | 'closing_window'
}

// ── Roadmap Progress ──────────────────────────────────────────────────────────

/** Progress per food group */
export interface RoadmapProgress {
  group: FoodGroup
  labelEs: string
  triedCount: number
  totalCount: number
  percentage: number // 0-100
  foods: RoadmapFood[]
}

/** Individual food status within a roadmap group */
export interface RoadmapFood {
  foodId: string
  name: string
  status: 'tried' | 'pending' | 'rejected'
}

// ── Weekly Balance Insight ────────────────────────────────────────────────────

/** A/L balance insight for the past week */
export interface BalanceInsight {
  label: 'balanced' | 'astringent' | 'laxative'
  labelEs: string // e.g. "Mayormente equilibrada"
  severity: 'green' | 'yellow' | 'red'
  tip: string // Rotating tip from curated list
}

// ── Meal Slots ────────────────────────────────────────────────────────────────

/** Meal slots for quick registration on the dashboard */
export interface MealSlot {
  mealType: MealType
  label: string // e.g. "Desayuno"
  icon: string // emoji
  isRegistered: boolean
  registeredTime: string | null // HH:mm or null
  foodCount: number
}
