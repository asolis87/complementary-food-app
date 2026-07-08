/**
 * Barrel export tests for @pakulab/shared.
 *
 * Verifies that new dashboard types and constants are exported
 * from the public API (index.ts).
 */

import { describe, it, expect } from 'vitest'
import {
  // Dashboard constants
  BALANCE_TIPS,
  DASHBOARD_CACHE_TTL,
  LEGACY_MEAL_SLOTS,
  DEFAULT_SUGGESTIONS_LIMIT,
  MAX_SUGGESTIONS_LIMIT,
  SUGGESTION_LOOKBACK_DAYS,
  MEAL_TYPES_FOR_SLOTS,
  // Allergen thresholds
  ALLERGEN_AGE_THRESHOLDS,
  DEFAULT_ALLERGEN_MIN_AGE_MONTHS,
  CLOSING_WINDOW_AGE_MONTHS,
} from './index.js'

// Type-check-only imports (verify types are exported)
import type {
  DashboardData,
  BabyContext,
  TodayLog,
  SuggestedFood,
  AllergenAlert,
  RoadmapProgress,
  RoadmapFood,
  BalanceInsight,
  MealSlot,
} from './index.js'

import type { MealSlotDef } from './index.js'
import type { AllergenAgeThreshold } from './index.js'

describe('Barrel exports — Dashboard types', () => {
  it('exports DashboardData type (compile-time check)', () => {
    const data: DashboardData = {
      baby: { id: 'b1', name: 'Test', ageInMonths: 6, daysInAC: 30 },
      userTier: 'FREE',
      todayLogs: [],
      suggestedFoods: [],
      roadmapProgress: [],
      weeklyBalance: {
        label: 'balanced',
        labelEs: 'Equilibrado',
        severity: 'green',
        tip: 'Test tip',
      },
    }
    expect(data.baby.name).toBe('Test')
  })

  it('exports BabyContext type', () => {
    const baby: BabyContext = { id: 'b1', name: 'Test', ageInMonths: 6, daysInAC: 30 }
    expect(baby.ageInMonths).toBe(6)
  })

  it('exports TodayLog type', () => {
    const log: TodayLog = {
      id: 'l1', mealType: 'BREAKFAST' as any,
      time: '08:00', foodId: 'f1', foodName: 'Test',
      foodGroup: 'FRUIT', reaction: null, notes: null,
    }
    expect(log.foodName).toBe('Test')
  })

  it('exports SuggestedFood type', () => {
    const sf: SuggestedFood = {
      foodId: 'f1', name: 'Test', group: 'FRUIT', ageMonths: 6,
      benefit: 'test', isAllergen: false, allergenType: null, status: 'pending',
    }
    expect(sf.status).toBe('pending')
  })

  it('exports AllergenAlert type', () => {
    const alert: AllergenAlert = {
      allergenKey: 'huevo', nameEs: 'Huevo', icon: '🥚', minAgeMonths: 6, urgency: 'normal',
    }
    expect(alert.urgency).toBe('normal')
  })

  it('exports RoadmapProgress type', () => {
    const rp: RoadmapProgress = {
      group: 'FRUIT', labelEs: 'Frutas', triedCount: 1, totalCount: 10, percentage: 10, foods: [],
    }
    expect(rp.percentage).toBe(10)
  })

  it('exports RoadmapFood type', () => {
    const rf: RoadmapFood = { foodId: 'f1', name: 'Test', status: 'tried' }
    expect(rf.status).toBe('tried')
  })

  it('exports BalanceInsight type', () => {
    const bi: BalanceInsight = {
      label: 'balanced', labelEs: 'Equilibrado', severity: 'green', tip: 'Test',
    }
    expect(bi.severity).toBe('green')
  })

  it('exports MealSlot type', () => {
    const ms: MealSlot = {
      mealType: 'SNACK' as any, label: 'Snack', icon: '🍪',
      isRegistered: false, registeredTime: null, foodCount: 0,
    }
    expect(ms.isRegistered).toBe(false)
  })

  it('exports MealSlotDef type', () => {
    const def: MealSlotDef = {
      mealType: 'BREAKFAST' as any, label: 'Desayuno', icon: '🌅',
    }
    expect(def.label).toBe('Desayuno')
  })

  it('exports AllergenAgeThreshold type', () => {
    const threshold: AllergenAgeThreshold = {
      allergenKey: 'huevo', nameEs: 'Huevo', icon: '🥚', minAgeMonths: 6,
    }
    expect(threshold.minAgeMonths).toBe(6)
  })
})

describe('Barrel exports — Dashboard constants', () => {
  it('exports BALANCE_TIPS', () => {
    expect(Array.isArray(BALANCE_TIPS)).toBe(true)
    expect(BALANCE_TIPS).toHaveLength(8)
  })

  it('exports DASHBOARD_CACHE_TTL', () => {
    expect(DASHBOARD_CACHE_TTL.dashboard).toBe(60)
  })

  it('exports LEGACY_MEAL_SLOTS', () => {
    expect(LEGACY_MEAL_SLOTS).toHaveLength(4)
  })

  it('exports DEFAULT_SUGGESTIONS_LIMIT', () => {
    expect(DEFAULT_SUGGESTIONS_LIMIT).toBe(3)
  })

  it('exports MAX_SUGGESTIONS_LIMIT', () => {
    expect(MAX_SUGGESTIONS_LIMIT).toBe(10)
  })

  it('exports SUGGESTION_LOOKBACK_DAYS', () => {
    expect(SUGGESTION_LOOKBACK_DAYS).toBe(30)
  })

  it('exports MEAL_TYPES_FOR_SLOTS', () => {
    expect(MEAL_TYPES_FOR_SLOTS).toHaveLength(4)
  })

  it('exports ALLERGEN_AGE_THRESHOLDS', () => {
    expect(ALLERGEN_AGE_THRESHOLDS.length).toBeGreaterThanOrEqual(9)
  })

  it('exports DEFAULT_ALLERGEN_MIN_AGE_MONTHS', () => {
    expect(DEFAULT_ALLERGEN_MIN_AGE_MONTHS).toBe(6)
  })

  it('exports CLOSING_WINDOW_AGE_MONTHS', () => {
    expect(CLOSING_WINDOW_AGE_MONTHS).toBe(10)
  })
})
