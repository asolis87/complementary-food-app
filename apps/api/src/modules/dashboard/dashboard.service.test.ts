/**
 * Unit tests for dashboard service layer.
 *
 * Tests business logic: suggestion sorting, allergen window logic,
 * roadmap progress calculation, and balance insight calculation.
 *
 * Spec: REQ-DASH-BIZ-01 through REQ-DASH-BIZ-05
 */

import { describe, it, expect, vi } from 'vitest'
import {
  getRandomTip,
  deriveBenefit,
  calculateAgeAndDaysInAC,
  sortSuggestions,
  buildAllergenAlerts,
  computeRoadmapProgress,
  computeWeeklyBalance,
  getSuggestedFoods,
  getPendingAllergens,
  getRoadmapProgress,
  getTodayLogs,
  getWeeklyBalance,
  getDashboardData,
  getSnackSuggestions,
} from './dashboard.service.js'
import { BALANCE_TIPS } from '@pakulab/shared'
import type { FoodGroup, SuggestedFood } from '@pakulab/shared'
import type { PrismaClient } from '@prisma/client'

// ── Helpers ───────────────────────────────────────────────────────────────────

type MockPrisma = {
  food: { findMany: ReturnType<typeof vi.fn> }
  foodLog: { findMany: ReturnType<typeof vi.fn> }
  babyProfile: { findFirst: ReturnType<typeof vi.fn> }
  $transaction: ReturnType<typeof vi.fn>
}

function createMockPrisma(overrides: Partial<MockPrisma> = {}): MockPrisma & { [key: string]: unknown } {
  return {
    food: { findMany: vi.fn().mockResolvedValue([]) },
    foodLog: { findMany: vi.fn().mockResolvedValue([]) },
    babyProfile: { findFirst: vi.fn().mockResolvedValue(null) },
    $transaction: vi.fn().mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => cb({})),
    ...overrides,
  }
}

// ── getRandomTip ──────────────────────────────────────────────────────────────

describe('getRandomTip', () => {
  it('returns a string from the curated tips list', () => {
    const tip = getRandomTip()
    expect(typeof tip).toBe('string')
    expect(tip.length).toBeGreaterThan(0)
  })

  it('returns different tips on multiple calls (statistically likely)', () => {
    const tips = new Set<string>()
    for (let i = 0; i < 20; i++) {
      tips.add(getRandomTip())
    }
    // With 8 tips and 20 calls, we should get at least 2 different tips
    expect(tips.size).toBeGreaterThanOrEqual(2)
  })

  it('only returns tips from the curated list', () => {
    for (let i = 0; i < 50; i++) {
      const tip = getRandomTip()
      expect(BALANCE_TIPS).toContain(tip)
    }
  })
})

// ── deriveBenefit ─────────────────────────────────────────────────────────────

describe('deriveBenefit', () => {
  it('returns a protein-related benefit for PROTEIN group', () => {
    const benefit = deriveBenefit({
      group: 'PROTEIN' as FoodGroup,
      isAllergen: false,
      ageMonths: 6,
    })
    expect(typeof benefit).toBe('string')
    expect(benefit.length).toBeGreaterThan(0)
  })

  it('returns a fiber-related benefit for FRUIT group', () => {
    const benefit = deriveBenefit({
      group: 'FRUIT' as FoodGroup,
      isAllergen: false,
      ageMonths: 6,
    })
    expect(typeof benefit).toBe('string')
  })

  it('returns allergen benefit text for allergen foods', () => {
    const benefit = deriveBenefit({
      group: 'PROTEIN' as FoodGroup,
      isAllergen: true,
      ageMonths: 6,
    })
    expect(benefit.toLowerCase()).toContain('alérgeno')
  })

  it('returns age-appropriate benefit for young babies', () => {
    const benefit = deriveBenefit({
      group: 'VEGETABLE' as FoodGroup,
      isAllergen: false,
      ageMonths: 6,
    })
    expect(typeof benefit).toBe('string')
  })
})

// ── calculateAgeAndDaysInAC ───────────────────────────────────────────────────

describe('calculateAgeAndDaysInAC', () => {
  it('computes age in months from birthDate', () => {
    const birthDate = new Date()
    birthDate.setMonth(birthDate.getMonth() - 8)
    const { ageInMonths } = calculateAgeAndDaysInAC(birthDate, null)
    expect(ageInMonths).toBeGreaterThanOrEqual(7)
    expect(ageInMonths).toBeLessThanOrEqual(9)
  })

  it('returns default daysInAC when acStartDate is null', () => {
    const birthDate = new Date()
    const { daysInAC } = calculateAgeAndDaysInAC(birthDate, null)
    expect(daysInAC).toBe(0)
  })

  it('computes daysInAC from acStartDate when provided', () => {
    const birthDate = new Date()
    birthDate.setMonth(birthDate.getMonth() - 8)
    const acStartDate = new Date()
    acStartDate.setDate(acStartDate.getDate() - 52)
    const { daysInAC } = calculateAgeAndDaysInAC(birthDate, acStartDate)
    expect(daysInAC).toBeGreaterThanOrEqual(51)
    expect(daysInAC).toBeLessThanOrEqual(53)
  })
})

// ── sortSuggestions ────────────────────────────────────────────────────────────

describe('sortSuggestions', () => {
  it('prioritizes pending allergens over non-allergens', () => {
    const foods = [
      { id: '1', name: 'Zanahoria', group: 'VEGETABLE' as FoodGroup, alClassification: 'NEUTRAL', ageMonths: 6, isAllergen: false, allergenType: null, isIronRich: false },
      { id: '2', name: 'Huevo', group: 'PROTEIN' as FoodGroup, alClassification: 'ASTRINGENT', ageMonths: 6, isAllergen: true, allergenType: 'huevo', isIronRich: false },
      { id: '3', name: 'Manzana', group: 'FRUIT' as FoodGroup, alClassification: 'NEUTRAL', ageMonths: 6, isAllergen: false, allergenType: null, isIronRich: false },
    ]
    const triedFoodIds = new Set<string>(['3'])

    const sorted = sortSuggestions(foods, triedFoodIds, undefined, 6)
    // Allergens should come first
    expect(sorted[0]!.name).toBe('Huevo')
  })

  it('returns empty array for empty input', () => {
    const sorted = sortSuggestions([], new Set(), undefined, 6)
    expect(sorted).toEqual([])
  })

  it('limits results to specified limit', () => {
    const foods = Array.from({ length: 20 }, (_, i) => ({
      id: `food-${i}`,
      name: `Food ${i}`,
      group: 'FRUIT' as FoodGroup,
      alClassification: 'NEUTRAL',
      ageMonths: 6,
      isAllergen: false,
      allergenType: null as string | null,
      isIronRich: false,
    }))
    const sorted = sortSuggestions(foods, new Set(), 5, 6)
    expect(sorted).toHaveLength(5)
  })

  it('defaults limit to 3', () => {
    const foods = Array.from({ length: 10 }, (_, i) => ({
      id: `food-${i}`,
      name: `Food ${i}`,
      group: 'FRUIT' as FoodGroup,
      alClassification: 'NEUTRAL',
      ageMonths: 6,
      isAllergen: false,
      allergenType: null as string | null,
      isIronRich: false,
    }))
    const sorted = sortSuggestions(foods, new Set(), undefined, 6)
    expect(sorted).toHaveLength(3)
  })
})

// ── sortSuggestions — Iron Priority (REQ-A1) ──────────────────────────────────

describe('sortSuggestions — Iron Priority for 10-23m (REQ-A1)', () => {
  it('prioritizes iron-rich foods first when baby is >= 10 months', () => {
    const foods = [
      { id: '1', name: 'Plátano', group: 'FRUIT' as FoodGroup, alClassification: 'NEUTRAL', ageMonths: 6, isAllergen: false, allergenType: null, isIronRich: false },
      { id: '2', name: 'Hígado de pollo', group: 'PROTEIN' as FoodGroup, alClassification: 'NEUTRAL', ageMonths: 8, isAllergen: false, allergenType: null, isIronRich: true },
      { id: '3', name: 'Manzana', group: 'FRUIT' as FoodGroup, alClassification: 'NEUTRAL', ageMonths: 6, isAllergen: false, allergenType: null, isIronRich: false },
      { id: '4', name: 'Lenteja', group: 'PROTEIN' as FoodGroup, alClassification: 'NEUTRAL', ageMonths: 7, isAllergen: false, allergenType: null, isIronRich: true },
      { id: '5', name: 'Espinaca', group: 'VEGETABLE' as FoodGroup, alClassification: 'NEUTRAL', ageMonths: 6, isAllergen: false, allergenType: null, isIronRich: true },
    ]

    const sorted = sortSuggestions(foods, new Set(), 5, 11) // 11-month baby
    // First 3 should be iron-rich (REQ-A1)
    expect(sorted.slice(0, 3).every(f => f.isIronRich)).toBe(true)
  })

  it('ensures at least 30% iron-rich foods when baby is >= 10 months', () => {
    const foods = [
      { id: '1', name: 'Plátano', group: 'FRUIT' as FoodGroup, alClassification: 'NEUTRAL', ageMonths: 6, isAllergen: false, allergenType: null, isIronRich: false },
      { id: '2', name: 'Hígado', group: 'PROTEIN' as FoodGroup, alClassification: 'NEUTRAL', ageMonths: 8, isAllergen: false, allergenType: null, isIronRich: true },
      { id: '3', name: 'Manzana', group: 'FRUIT' as FoodGroup, alClassification: 'NEUTRAL', ageMonths: 6, isAllergen: false, allergenType: null, isIronRich: false },
      { id: '4', name: 'Lenteja', group: 'PROTEIN' as FoodGroup, alClassification: 'NEUTRAL', ageMonths: 7, isAllergen: false, allergenType: null, isIronRich: true },
      { id: '5', name: 'Aguacate', group: 'HEALTHY_FAT' as FoodGroup, alClassification: 'NEUTRAL', ageMonths: 6, isAllergen: false, allergenType: null, isIronRich: false },
      { id: '6', name: 'Frijol', group: 'PROTEIN' as FoodGroup, alClassification: 'NEUTRAL', ageMonths: 8, isAllergen: false, allergenType: null, isIronRich: true },
      { id: '7', name: 'Papaya', group: 'FRUIT' as FoodGroup, alClassification: 'NEUTRAL', ageMonths: 6, isAllergen: false, allergenType: null, isIronRich: false },
      { id: '8', name: 'Espinaca', group: 'VEGETABLE' as FoodGroup, alClassification: 'NEUTRAL', ageMonths: 6, isAllergen: false, allergenType: null, isIronRich: true },
      { id: '9', name: 'Calabaza', group: 'VEGETABLE' as FoodGroup, alClassification: 'NEUTRAL', ageMonths: 6, isAllergen: false, allergenType: null, isIronRich: false },
      { id: '10', name: 'Acelga', group: 'VEGETABLE' as FoodGroup, alClassification: 'NEUTRAL', ageMonths: 6, isAllergen: false, allergenType: null, isIronRich: true },
    ]

    const sorted = sortSuggestions(foods, new Set(), 10, 11) // 11-month baby, 10 suggestions
    const ironCount = sorted.filter(f => f.isIronRich).length
    // At least 30% (3 out of 10) should be iron-rich
    expect(ironCount).toBeGreaterThanOrEqual(3)
  })

  it('does NOT prioritize iron-rich foods when baby is < 10 months', () => {
    const foods = [
      { id: '1', name: 'Plátano', group: 'FRUIT' as FoodGroup, alClassification: 'NEUTRAL', ageMonths: 6, isAllergen: false, allergenType: null, isIronRich: false },
      { id: '2', name: 'Hígado de pollo', group: 'PROTEIN' as FoodGroup, alClassification: 'NEUTRAL', ageMonths: 8, isAllergen: false, allergenType: null, isIronRich: true },
      { id: '3', name: 'Manzana', group: 'FRUIT' as FoodGroup, alClassification: 'NEUTRAL', ageMonths: 6, isAllergen: false, allergenType: null, isIronRich: false },
    ]

    const sorted = sortSuggestions(foods, new Set(), 3, 7) // 7-month baby
    // No guarantee that iron foods come first for < 10 months
    expect(sorted).toHaveLength(3)
  })

  it('gracefully handles case when NO iron-rich foods are available (REQ-A2)', () => {
    const foods = [
      { id: '1', name: 'Plátano', group: 'FRUIT' as FoodGroup, alClassification: 'NEUTRAL', ageMonths: 6, isAllergen: false, allergenType: null, isIronRich: false },
      { id: '2', name: 'Manzana', group: 'FRUIT' as FoodGroup, alClassification: 'NEUTRAL', ageMonths: 6, isAllergen: false, allergenType: null, isIronRich: false },
      { id: '3', name: 'Aguacate', group: 'HEALTHY_FAT' as FoodGroup, alClassification: 'NEUTRAL', ageMonths: 6, isAllergen: false, allergenType: null, isIronRich: false },
    ]

    const sorted = sortSuggestions(foods, new Set(), 3, 11) // 11-month baby, no iron foods
    // Should return normal suggestions, not crash or return empty
    expect(sorted).toHaveLength(3)
    expect(sorted.every(f => !f.isIronRich)).toBe(true)
  })

  it('leads with a pending allergen, then iron-rich foods, for >= 10m (REQ-A1 + allergen window reconciled)', () => {
    // At 10-12m both goals peak: the allergen introduction window is closing AND
    // iron matters for anemia. A PENDING allergen keeps the lead (window-critical),
    // then iron-rich foods follow with priority over the normal rotation.
    const foods = [
      { id: '1', name: 'Plátano', group: 'FRUIT' as FoodGroup, alClassification: 'NEUTRAL', ageMonths: 6, isAllergen: false, allergenType: null, isIronRich: false },
      { id: '2', name: 'Hígado', group: 'PROTEIN' as FoodGroup, alClassification: 'NEUTRAL', ageMonths: 8, isAllergen: false, allergenType: null, isIronRich: true },
      { id: '3', name: 'Lenteja', group: 'PROTEIN' as FoodGroup, alClassification: 'NEUTRAL', ageMonths: 8, isAllergen: false, allergenType: null, isIronRich: true },
      { id: '4', name: 'Huevo', group: 'PROTEIN' as FoodGroup, alClassification: 'NEUTRAL', ageMonths: 6, isAllergen: true, allergenType: 'huevo', isIronRich: false },
    ]

    const sorted = sortSuggestions(foods, new Set(), 4, 11) // 11-month baby
    // The pending allergen leads (window closing), then the iron-rich foods.
    expect(sorted[0]!.name).toBe('Huevo')
    expect(sorted[1]!.isIronRich).toBe(true)
    expect(sorted[2]!.isIronRich).toBe(true)
  })
})

// ── buildAllergenAlerts ───────────────────────────────────────────────────────

describe('buildAllergenAlerts', () => {
  it('returns empty array when baby is under 6 months', () => {
    const alerts = buildAllergenAlerts(4, [])
    expect(alerts).toEqual([])
  })

  it('returns normal urgency for babies between 6-9 months', () => {
    const alerts = buildAllergenAlerts(7, [])
    expect(alerts.length).toBeGreaterThan(0)
    for (const alert of alerts) {
      expect(alert.urgency).toBe('normal')
    }
  })

  it('returns closing_window urgency for babies >= 10 months', () => {
    const alerts = buildAllergenAlerts(10, [])
    expect(alerts.length).toBeGreaterThan(0)
    for (const alert of alerts) {
      expect(alert.urgency).toBe('closing_window')
    }
  })

  it('excludes already tried allergens', () => {
    const triedAllergens = ['huevo', 'leche']
    const alerts = buildAllergenAlerts(8, triedAllergens)
    const keys = alerts.map((a) => a.allergenKey)
    expect(keys).not.toContain('huevo')
    expect(keys).not.toContain('leche')
  })

  it('returns empty when all allergens have been tried', () => {
    const allKeys = ['leche', 'huevo', 'cacahuate', 'pescado', 'soya', 'gluten', 'nueces', 'ajonjoli', 'mostaza']
    const alerts = buildAllergenAlerts(8, allKeys)
    expect(alerts).toEqual([])
  })
})

// ── computeRoadmapProgress ────────────────────────────────────────────────────

describe('computeRoadmapProgress', () => {
  it('calculates correct percentage for a group', () => {
    const groupStats = { group: 'FRUIT' as FoodGroup, triedCount: 5, totalCount: 10 }
    const foodsWithReactions = new Map<string, { foodId: string; name: string; reaction: string | null; date: Date }>()
    
    const progress = computeRoadmapProgress(
      groupStats,
      5, // total foods available
      foodsWithReactions,
      'Frutas'
    )

    expect(progress.percentage).toBe(50)
    expect(progress.triedCount).toBe(5)
    expect(progress.totalCount).toBe(10)
  })

  it('returns 0% when totalCount is 0', () => {
    const groupStats = { group: 'HEALTHY_FAT' as FoodGroup, triedCount: 0, totalCount: 0 }
    const progress = computeRoadmapProgress(
      groupStats,
      3,
      new Map(),
      'Grasas Saludables'
    )
    expect(progress.percentage).toBe(0)
  })

  it('marks foods as tried, pending, or rejected based on reactions', () => {
    const foodsWithReactions = new Map<string, { foodId: string; name: string; reaction: string | null; date: Date }>([
      ['f1', { foodId: 'f1', name: 'Zanahoria', reaction: 'LIKED', date: new Date() }],
      ['f2', { foodId: 'f2', name: 'Espinaca', reaction: 'REJECTED', date: new Date() }],
    ])
    const groupStats = { group: 'VEGETABLE' as FoodGroup, triedCount: 2, totalCount: 2 }

    const progress = computeRoadmapProgress(
      groupStats,
      2,
      foodsWithReactions,
      'Verduras'
    )

    const tried = progress.foods.find((f) => f.foodId === 'f1')
    const rejected = progress.foods.find((f) => f.foodId === 'f2')
    expect(tried?.status).toBe('tried')
    expect(rejected?.status).toBe('rejected')
  })
})

// ── computeWeeklyBalance ──────────────────────────────────────────────────────

describe('computeWeeklyBalance', () => {
  it('returns "Sin datos" when no logs exist', () => {
    const insight = computeWeeklyBalance([])
    expect(insight.label).toBe('balanced')
    expect(insight.labelEs).toBe('Sin datos suficientes')
    expect(insight.severity).toBe('green')
  })

  it('returns green severity for balanced week', () => {
    // 4 astringent, 4 laxative, 2 neutral = balanced
    const logs = [
      { food: { alClassification: 'ASTRINGENT' } },
      { food: { alClassification: 'ASTRINGENT' } },
      { food: { alClassification: 'ASTRINGENT' } },
      { food: { alClassification: 'ASTRINGENT' } },
      { food: { alClassification: 'LAXATIVE' } },
      { food: { alClassification: 'LAXATIVE' } },
      { food: { alClassification: 'LAXATIVE' } },
      { food: { alClassification: 'LAXATIVE' } },
      { food: { alClassification: 'NEUTRAL' } },
      { food: { alClassification: 'NEUTRAL' } },
    ]
    const insight = computeWeeklyBalance(logs)
    expect(insight.severity).toBe('green')
  })

  it('returns yellow severity for leaning astringent', () => {
    // 8 astringent, 2 laxative = heavily astringent (score=0.6 > 0.34)
    const astringentItems: Array<{ food: { alClassification: string } }> = Array.from({ length: 8 }, () => ({
      food: { alClassification: 'ASTRINGENT' },
    }))
    const laxativeItems: Array<{ food: { alClassification: string } }> = Array.from({ length: 2 }, () => ({
      food: { alClassification: 'LAXATIVE' },
    }))
    const logs = [...astringentItems, ...laxativeItems]
    const insight = computeWeeklyBalance(logs)
    expect(insight.label).toBe('astringent')
  })

  it('returns red severity for heavily laxative', () => {
    // 9 laxative, 1 astringent = heavily laxative (score=-0.8 < -0.67)
    const laxativeItems: Array<{ food: { alClassification: string } }> = Array.from({ length: 9 }, () => ({
      food: { alClassification: 'LAXATIVE' },
    }))
    const astringentItems: Array<{ food: { alClassification: string } }> = [
      { food: { alClassification: 'ASTRINGENT' } },
    ]
    const logs = [...laxativeItems, ...astringentItems]
    const insight = computeWeeklyBalance(logs)
    expect(insight.severity).toBe('red')
  })

  it('includes a random curated tip', () => {
    const logs = [{ food: { alClassification: 'NEUTRAL' as const } }]
    const insight = computeWeeklyBalance(logs)
    expect(typeof insight.tip).toBe('string')
    expect(BALANCE_TIPS).toContain(insight.tip)
  })
})

// ── getSuggestedFoods (integration-style) ─────────────────────────────────────

describe('getSuggestedFoods', () => {
  it('returns empty array when no age-appropriate foods exist', async () => {
    const prisma = createMockPrisma({
      food: { findMany: vi.fn().mockResolvedValue([]) },
    })
    const result = await getSuggestedFoods(
      prisma as unknown as PrismaClient,
      'baby-1',
      6,
      3
    )
    expect(result).toEqual([])
  })

  it('excludes foods tried in last 30 days', async () => {
    const mockFoods = [
      { id: 'f1', name: 'Huevo', group: 'PROTEIN', alClassification: 'ASTRINGENT', ageMonths: 6, isAllergen: true, allergenType: 'huevo' },
      { id: 'f2', name: 'Zanahoria', group: 'VEGETABLE', alClassification: 'NEUTRAL', ageMonths: 6, isAllergen: false, allergenType: null },
    ]
    const recentDate = new Date()
    recentDate.setDate(recentDate.getDate() - 5) // 5 days ago
    const mockLogs = [
      { foodId: 'f1' }, // Huevo was tried recently
    ]

    const prisma = createMockPrisma({
      food: { findMany: vi.fn().mockResolvedValue(mockFoods) },
      foodLog: { findMany: vi.fn().mockResolvedValue(mockLogs) },
    })

    const result = await getSuggestedFoods(
      prisma as unknown as PrismaClient,
      'baby-1',
      6,
      3
    )

    // Should only include Zanahoria (not Huevo - recently tried)
    expect(result).toHaveLength(1)
    expect(result[0]!.name).toBe('Zanahoria')
  })
})

// ── getPendingAllergens (integration-style) ────────────────────────────────────

describe('getPendingAllergens', () => {
  it('returns empty array when baby is under 6 months', async () => {
    const prisma = createMockPrisma()
    const result = await getPendingAllergens(
      prisma as unknown as PrismaClient,
      'baby-1',
      4
    )
    expect(result).toEqual([])
  })

  it('returns allergen alerts for babies >= 6 months', async () => {
    const mockLogs: Array<{ foodId: string; food: { allergenType: string | null } }> = [
      { foodId: 'f1', food: { allergenType: 'huevo' } }, // Huevo was tried
    ]

    const prisma = createMockPrisma({
      foodLog: { findMany: vi.fn().mockResolvedValue(mockLogs) },
    })

    const result = await getPendingAllergens(
      prisma as unknown as PrismaClient,
      'baby-1',
      7
    )

    // At least 8 allergens should remain (9 total minus huevo)
    expect(result.length).toBeGreaterThanOrEqual(8)
    // Huevo should be excluded since it was tried
    const keys = result.map((a) => a.allergenKey)
    expect(keys).not.toContain('huevo')
  })
})

// ── getRoadmapProgress (integration-style) ─────────────────────────────────────

describe('getRoadmapProgress', () => {
  it('returns progress for all food groups with age-appropriate foods', async () => {
    const mockFoods = [
      { id: 'f1', name: 'Zanahoria', group: 'VEGETABLE', ageMonths: 6 },
      { id: 'f2', name: 'Brócoli', group: 'VEGETABLE', ageMonths: 8 },
    ]
    const mockLogs = [
      { foodId: 'f1', date: new Date(), food: { id: 'f1', name: 'Zanahoria', group: 'VEGETABLE' } },
    ]

    const prisma = createMockPrisma({
      food: { findMany: vi.fn().mockResolvedValue(mockFoods) },
      foodLog: { findMany: vi.fn().mockResolvedValue(mockLogs) },
    })

    const result = await getRoadmapProgress(
      prisma as unknown as PrismaClient,
      'baby-1',
      8
    )

    expect(result.length).toBeGreaterThan(0)
    const vegGroup = result.find((r) => r.group === 'VEGETABLE')
    expect(vegGroup).toBeDefined()
    expect(vegGroup!.triedCount).toBe(1)
    expect(vegGroup!.totalCount).toBe(2)
    expect(vegGroup!.percentage).toBe(50)
  })
})

// ── getTodayLogs ──────────────────────────────────────────────────────────────

describe('getTodayLogs', () => {
  it('returns empty logs array when no logs for today', async () => {
    const prisma = createMockPrisma({
      foodLog: { findMany: vi.fn().mockResolvedValue([]) },
    })

    const result = await getTodayLogs(
      prisma as unknown as PrismaClient,
      'baby-1'
    )

    expect(result.logs).toEqual([])
    expect(result.mealSlots).toHaveLength(4)
  })

  it('returns 4 meal slots regardless of log count', async () => {
    const mockLogs = [
      {
        id: 'log-1', userId: 'user-1', babyProfileId: 'baby-1',
        foodId: 'f1', date: new Date(), time: '08:30',
        mealType: 'BREAKFAST', reaction: null, notes: null,
        food: { id: 'f1', name: 'Avena', group: 'CEREAL_TUBER', alClassification: 'NEUTRAL', isAllergen: false, allergenType: null },
      },
    ]

    const prisma = createMockPrisma({
      foodLog: { findMany: vi.fn().mockResolvedValue(mockLogs) },
    })

    const result = await getTodayLogs(
      prisma as unknown as PrismaClient,
      'baby-1'
    )

    expect(result.mealSlots).toHaveLength(4)
    const breakfastSlot = result.mealSlots.find((s) => s.mealType === 'BREAKFAST')
    expect(breakfastSlot?.isRegistered).toBe(true)
  })
})

// ── getWeeklyBalance ──────────────────────────────────────────────────────────

describe('getWeeklyBalance', () => {
  it('returns "Sin datos" for empty week', async () => {
    const prisma = createMockPrisma({
      foodLog: { findMany: vi.fn().mockResolvedValue([]) },
    })

    const result = await getWeeklyBalance(
      prisma as unknown as PrismaClient,
      'baby-1'
    )

    expect(result.labelEs).toBe('Sin datos suficientes')
  })
})

// ── getDashboardData ──────────────────────────────────────────────────────────

describe('getDashboardData', () => {
  it('aggregates all dashboard data in one call', async () => {
    const mockProfile = {
      id: 'baby-1',
      name: 'Mateo',
      birthDate: new Date('2025-08-15'),
      acStartDate: new Date('2026-03-01'),
      userId: 'user-1',
    }

    const prisma = createMockPrisma({
      babyProfile: { findFirst: vi.fn().mockResolvedValue(mockProfile) },
      food: { findMany: vi.fn().mockResolvedValue([]) },
      foodLog: { findMany: vi.fn().mockResolvedValue([]) },
    })

    const result = await getDashboardData(
      prisma as unknown as PrismaClient,
      'user-1',
      'baby-1'
    )

    expect(result.baby.name).toBe('Mateo')
    expect(result.baby.ageInMonths).toBeGreaterThan(0)
    expect(result.userTier).toBe('PRO')
    expect(Array.isArray(result.todayLogs)).toBe(true)
    expect(Array.isArray(result.suggestedFoods)).toBe(true)
    // pendingAllergens is a PRO feature served only via GET /api/dashboard/allergens.
    // It must NOT leak into the FREE-tier /api/dashboard bundle.
    expect('pendingAllergens' in result).toBe(false)
    expect(Array.isArray(result.roadmapProgress)).toBe(true)
    expect(result.weeklyBalance).toBeDefined()
  })
})

// ── getSnackSuggestions ───────────────────────────────────────────────────────

describe('getSnackSuggestions', () => {
  // getSnackSuggestions derives age from birthDate against the CURRENT date, so
  // tests must use dates relative to now (absolute literals silently drift into a
  // different age bucket as real time passes). ageInMonths counts whole calendar
  // months (year*12 + month diff, ignoring day-of-month), so we subtract exactly
  // `months` and pin the day to 1 to avoid end-of-month rollover skewing the count.
  const birthDateForAge = (months: number): Date => {
    const now = new Date()
    // Build in UTC: the service does birthDate.toISOString().split('T')[0], so a
    // local-timezone date could roll to the previous day/month in UTC and skew the age.
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - months, 15))
  }

  it('returns unavailable for baby of exactly 9 months (< 10m boundary)', async () => {
    const mockProfile = {
      id: 'baby-1',
      birthDate: birthDateForAge(9),
      userId: 'user-1',
      deletedAt: null,
    }

    const prisma = createMockPrisma({
      babyProfile: { findFirst: vi.fn().mockResolvedValue(mockProfile) },
    })

    const result = await getSnackSuggestions(
      prisma as unknown as PrismaClient,
      'baby-1'
    )

    expect(result).toEqual({
      available: false,
      reason: 'SNACKS_NOT_YET',
    })
  })

  it('returns 5 suggestions for baby of exactly 10 months (>= 10m boundary)', async () => {
    const mockProfile = {
      id: 'baby-1',
      birthDate: birthDateForAge(10),
      userId: 'user-1',
      deletedAt: null,
    }

    const mockFoods = [
      { id: '1', name: 'Plátano', group: 'FRUIT', ageMonths: 6, warningTags: [], isAllergen: false, allergenType: null },
      { id: '2', name: 'Yogur natural', group: 'PROTEIN', ageMonths: 6, warningTags: [], isAllergen: false, allergenType: null },
      { id: '3', name: 'Queso fresco', group: 'PROTEIN', ageMonths: 6, warningTags: [], isAllergen: false, allergenType: null },
      { id: '4', name: 'Mango', group: 'FRUIT', ageMonths: 6, warningTags: [], isAllergen: false, allergenType: null },
      { id: '5', name: 'Papaya', group: 'FRUIT', ageMonths: 6, warningTags: [], isAllergen: false, allergenType: null },
      { id: '6', name: 'Uvas enteras', group: 'FRUIT', ageMonths: 12, warningTags: ['CHOKING_HAZARD_UNDER_5Y'], isAllergen: false, allergenType: null },
    ]

    const prisma = createMockPrisma({
      babyProfile: { findFirst: vi.fn().mockResolvedValue(mockProfile) },
      food: { findMany: vi.fn().mockResolvedValue(mockFoods) },
    })

    const result = await getSnackSuggestions(
      prisma as unknown as PrismaClient,
      'baby-1'
    )

    expect(result.available).toBe(true)
    if (result.available) {
      expect(result.suggestions).toHaveLength(5)
      // Check none have choking hazard tag (not exposed in SuggestedFood type)
      const allSafe = result.suggestions.every((s: SuggestedFood) => s.name !== 'Uvas enteras')
      expect(allSafe).toBe(true)
    }
  })

  it('returns suggestions with galletas/pan/cereal for baby of exactly 12 months (extras boundary)', async () => {
    const mockProfile = {
      id: 'baby-1',
      birthDate: birthDateForAge(12),
      userId: 'user-1',
      deletedAt: null,
    }

    const mockFoods = [
      { id: '1', name: 'Plátano', group: 'FRUIT', ageMonths: 6, warningTags: [], isAllergen: false, allergenType: null },
      { id: '2', name: 'Yogur natural', group: 'PROTEIN', ageMonths: 6, warningTags: [], isAllergen: false, allergenType: null },
      { id: '3', name: 'Galletas sin azúcar', group: 'CEREAL_TUBER', ageMonths: 12, warningTags: [], isAllergen: false, allergenType: null },
      { id: '4', name: 'Pan suave', group: 'CEREAL_TUBER', ageMonths: 12, warningTags: [], isAllergen: false, allergenType: null },
      { id: '5', name: 'Cereal de arroz inflado', group: 'CEREAL_TUBER', ageMonths: 12, warningTags: [], isAllergen: false, allergenType: null },
    ]

    const prisma = createMockPrisma({
      babyProfile: { findFirst: vi.fn().mockResolvedValue(mockProfile) },
      food: { findMany: vi.fn().mockResolvedValue(mockFoods) },
    })

    const result = await getSnackSuggestions(
      prisma as unknown as PrismaClient,
      'baby-1'
    )

    expect(result.available).toBe(true)
    if (result.available) {
      const hasCereal = result.suggestions.some((s: SuggestedFood) => s.group === 'CEREAL_TUBER')
      expect(hasCereal).toBe(true)
    }
  })

  it('ensures at least 3 suggestions are frutas/yogur/queso', async () => {
    const mockProfile = {
      id: 'baby-1',
      birthDate: birthDateForAge(11),
      userId: 'user-1',
      deletedAt: null,
    }

    const mockFoods = [
      { id: '1', name: 'Plátano', group: 'FRUIT', ageMonths: 6, warningTags: [], isAllergen: false, allergenType: null },
      { id: '2', name: 'Yogur natural', group: 'PROTEIN', ageMonths: 6, warningTags: [], isAllergen: false, allergenType: null },
      { id: '3', name: 'Queso fresco', group: 'PROTEIN', ageMonths: 6, warningTags: [], isAllergen: false, allergenType: null },
      { id: '4', name: 'Mango', group: 'FRUIT', ageMonths: 6, warningTags: [], isAllergen: false, allergenType: null },
      { id: '5', name: 'Papaya', group: 'FRUIT', ageMonths: 6, warningTags: [], isAllergen: false, allergenType: null },
    ]

    const prisma = createMockPrisma({
      babyProfile: { findFirst: vi.fn().mockResolvedValue(mockProfile) },
      food: { findMany: vi.fn().mockResolvedValue(mockFoods) },
    })

    const result = await getSnackSuggestions(
      prisma as unknown as PrismaClient,
      'baby-1'
    )

    expect(result.available).toBe(true)
    if (result.available) {
      const softCount = result.suggestions.filter((s: SuggestedFood) =>
        s.group === 'FRUIT' || (s.group === 'PROTEIN' && (s.name.includes('Yogur') || s.name.includes('Queso')))
      ).length
      expect(softCount).toBeGreaterThanOrEqual(3)
    }
  })

  it('includes cooked vegetables (verduras cocidas) as snacks from 10m (REQ-B1)', async () => {
    const mockProfile = {
      id: 'baby-1',
      birthDate: birthDateForAge(11),
      userId: 'user-1',
      deletedAt: null,
    }

    // Only vegetables + one choking-hazard veg: the safe cooked vegetables must surface.
    const mockFoods = [
      { id: '1', name: 'Zanahoria cocida', group: 'VEGETABLE', ageMonths: 6, warningTags: [], isAllergen: false, allergenType: null },
      { id: '2', name: 'Calabaza cocida', group: 'VEGETABLE', ageMonths: 6, warningTags: [], isAllergen: false, allergenType: null },
      { id: '3', name: 'Elote entero', group: 'VEGETABLE', ageMonths: 12, warningTags: ['CHOKING_HAZARD_UNDER_5Y'], isAllergen: false, allergenType: null },
    ]

    const prisma = createMockPrisma({
      babyProfile: { findFirst: vi.fn().mockResolvedValue(mockProfile) },
      food: { findMany: vi.fn().mockResolvedValue(mockFoods) },
    })

    const result = await getSnackSuggestions(prisma as unknown as PrismaClient, 'baby-1')

    expect(result.available).toBe(true)
    if (result.available) {
      const veggies = result.suggestions.filter((s: SuggestedFood) => s.group === 'VEGETABLE')
      expect(veggies.length).toBeGreaterThanOrEqual(2) // both cooked veggies surface
      expect(result.suggestions.some((s: SuggestedFood) => s.name === 'Elote entero')).toBe(false)
    }
  })

  it('returns fewer than 5 suggestions when few candidates exist (graceful degradation)', async () => {
    const mockProfile = {
      id: 'baby-1',
      birthDate: birthDateForAge(11),
      userId: 'user-1',
      deletedAt: null,
    }

    const mockFoods = [
      { id: '1', name: 'Plátano', group: 'FRUIT', ageMonths: 6, warningTags: [], isAllergen: false, allergenType: null },
      { id: '2', name: 'Yogur natural', group: 'PROTEIN', ageMonths: 6, warningTags: [], isAllergen: false, allergenType: null },
    ]

    const prisma = createMockPrisma({
      babyProfile: { findFirst: vi.fn().mockResolvedValue(mockProfile) },
      food: { findMany: vi.fn().mockResolvedValue(mockFoods) },
    })

    const result = await getSnackSuggestions(prisma as unknown as PrismaClient, 'baby-1')

    expect(result.available).toBe(true)
    if (result.available) {
      expect(result.suggestions.length).toBe(2) // returns what's available, no crash
    }
  })

  it('throws when the baby profile does not exist', async () => {
    const prisma = createMockPrisma({
      babyProfile: { findFirst: vi.fn().mockResolvedValue(null) },
    })

    await expect(
      getSnackSuggestions(prisma as unknown as PrismaClient, 'nonexistent'),
    ).rejects.toThrow('Baby profile not found')
  })
})
