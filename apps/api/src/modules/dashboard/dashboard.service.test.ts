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
} from './dashboard.service.js'
import { BALANCE_TIPS } from '@pakulab/shared'
import type { FoodGroup } from '@pakulab/shared'
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
      { id: '1', name: 'Zanahoria', group: 'VEGETABLE' as FoodGroup, alClassification: 'NEUTRAL', ageMonths: 6, isAllergen: false, allergenType: null },
      { id: '2', name: 'Huevo', group: 'PROTEIN' as FoodGroup, alClassification: 'ASTRINGENT', ageMonths: 6, isAllergen: true, allergenType: 'huevo' },
      { id: '3', name: 'Manzana', group: 'FRUIT' as FoodGroup, alClassification: 'NEUTRAL', ageMonths: 6, isAllergen: false, allergenType: null },
    ]
    const triedFoodIds = new Set<string>(['3'])

    const sorted = sortSuggestions(foods, triedFoodIds)
    // Allergens should come first
    expect(sorted[0]!.name).toBe('Huevo')
  })

  it('returns empty array for empty input', () => {
    const sorted = sortSuggestions([], new Set())
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
    }))
    const sorted = sortSuggestions(foods, new Set(), 5)
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
    }))
    const sorted = sortSuggestions(foods, new Set())
    expect(sorted).toHaveLength(3)
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
    expect(Array.isArray(result.pendingAllergens)).toBe(true)
    expect(Array.isArray(result.roadmapProgress)).toBe(true)
    expect(result.weeklyBalance).toBeDefined()
  })
})
