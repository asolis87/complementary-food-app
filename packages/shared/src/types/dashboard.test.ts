/**
 * Unit tests for Dashboard types contract.
 *
 * These tests assert that the dashboard data interfaces have the expected shape.
 *
 * Spec: REQ-DASH-01 through REQ-DASH-06
 */

import { describe, it, expect } from 'vitest'
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
} from './dashboard.js'
import { MealType, ReactionType } from './diary.js'

describe('DashboardData type contract', () => {
  it('accepts a complete DashboardData object', () => {
    const data: DashboardData = {
      baby: {
        id: 'baby-1',
        name: 'Mateo',
        ageInMonths: 8,
        daysInAC: 52,
      },
      userTier: 'PRO',
      todayLogs: [],
      suggestedFoods: [],
      pendingAllergens: [],
      roadmapProgress: [],
      weeklyBalance: {
        label: 'balanced',
        labelEs: 'Mayormente equilibrada',
        severity: 'green',
        tip: 'La avena es suave para el estómago.',
      },
    }
    expect(data.baby.name).toBe('Mateo')
    expect(data.userTier).toBe('PRO')
    expect(data.weeklyBalance.severity).toBe('green')
  })

  it('userTier accepts FREE tier', () => {
    const data: DashboardData = {
      baby: { id: 'b1', name: 'Sofía', ageInMonths: 6, daysInAC: 15 },
      userTier: 'FREE',
      todayLogs: [],
      suggestedFoods: [],
      pendingAllergens: [],
      roadmapProgress: [],
      weeklyBalance: {
        label: 'balanced',
        labelEs: 'Sin datos suficientes',
        severity: 'green',
        tip: 'Las zanahorias cocidas son fáciles de digerir.',
      },
    }
    expect(data.userTier).toBe('FREE')
  })
})

describe('BabyContext type contract', () => {
  it('has all required fields', () => {
    const baby: BabyContext = {
      id: 'baby-1',
      name: 'Mateo',
      ageInMonths: 8,
      daysInAC: 52,
    }
    expect(baby.id).toBe('baby-1')
    expect(baby.name).toBe('Mateo')
    expect(baby.ageInMonths).toBe(8)
    expect(baby.daysInAC).toBe(52)
  })
})

describe('TodayLog type contract', () => {
  it('allows meal log entries with food details', () => {
    const log: TodayLog = {
      id: 'log-1',
      mealType: MealType.BREAKFAST,
      time: '08:30',
      foodId: 'food-1',
      foodName: 'Manzana rallada',
      foodGroup: 'FRUIT',
      reaction: ReactionType.LIKED,
      notes: null,
    }
    expect(log.mealType).toBe(MealType.BREAKFAST)
    expect(log.foodName).toBe('Manzana rallada')
    expect(log.time).toBe('08:30')
  })

  it('allows null reaction and time for pending logs', () => {
    const log: TodayLog = {
      id: 'log-2',
      mealType: MealType.DINNER,
      time: null,
      foodId: 'food-2',
      foodName: 'Zanahoria',
      foodGroup: 'VEGETABLE',
      reaction: null,
      notes: null,
    }
    expect(log.reaction).toBeNull()
    expect(log.time).toBeNull()
  })
})

describe('SuggestedFood type contract', () => {
  it('has all required fields for allergen suggestion', () => {
    const food: SuggestedFood = {
      foodId: 'food-10',
      name: 'Huevo',
      group: 'PROTEIN',
      ageMonths: 8,
      benefit: 'Alto en proteína',
      isAllergen: true,
      allergenType: 'huevo',
      status: 'pending',
    }
    expect(food.name).toBe('Huevo')
    expect(food.isAllergen).toBe(true)
    expect(food.allergenType).toBe('huevo')
    expect(food.status).toBe('pending')
  })

  it('allows null allergenType for non-allergen foods', () => {
    const food: SuggestedFood = {
      foodId: 'food-5',
      name: 'Zanahoria',
      group: 'VEGETABLE',
      ageMonths: 6,
      benefit: 'Fácil de digerir',
      isAllergen: false,
      allergenType: null,
      status: 'tried',
    }
    expect(food.isAllergen).toBe(false)
    expect(food.allergenType).toBeNull()
    expect(food.status).toBe('tried')
  })

  it('supports all three status values', () => {
    const pending: SuggestedFood = {
      foodId: 'f1', name: 'A', group: 'FRUIT', ageMonths: 6,
      benefit: 'test', isAllergen: false, allergenType: null, status: 'pending',
    }
    const tried: SuggestedFood = {
      foodId: 'f2', name: 'B', group: 'VEGETABLE', ageMonths: 6,
      benefit: 'test', isAllergen: false, allergenType: null, status: 'tried',
    }
    const rejected: SuggestedFood = {
      foodId: 'f3', name: 'C', group: 'PROTEIN', ageMonths: 6,
      benefit: 'test', isAllergen: false, allergenType: null, status: 'rejected',
    }
    expect(pending.status).toBe('pending')
    expect(tried.status).toBe('tried')
    expect(rejected.status).toBe('rejected')
  })
})

describe('AllergenAlert type contract', () => {
  it('has all required fields for normal urgency', () => {
    const alert: AllergenAlert = {
      allergenKey: 'huevo',
      nameEs: 'Huevo',
      icon: '🥚',
      minAgeMonths: 6,
      urgency: 'normal',
    }
    expect(alert.allergenKey).toBe('huevo')
    expect(alert.urgency).toBe('normal')
  })

  it('supports closing_window urgency for babies >= 10 months', () => {
    const alert: AllergenAlert = {
      allergenKey: 'cacahuate',
      nameEs: 'Cacahuate',
      icon: '🥜',
      minAgeMonths: 6,
      urgency: 'closing_window',
    }
    expect(alert.urgency).toBe('closing_window')
  })
})

describe('RoadmapProgress type contract', () => {
  it('has all required fields with foods array', () => {
    const progress: RoadmapProgress = {
      group: 'VEGETABLE',
      labelEs: 'Verduras',
      triedCount: 6,
      totalCount: 10,
      percentage: 60,
      foods: [
        { foodId: 'v1', name: 'Zanahoria', status: 'tried' },
        { foodId: 'v2', name: 'Brócoli', status: 'tried' },
      ],
    }
    expect(progress.group).toBe('VEGETABLE')
    expect(progress.percentage).toBe(60)
    expect(progress.foods).toHaveLength(2)
  })

  it('handles empty foods array for 0% progress', () => {
    const progress: RoadmapProgress = {
      group: 'HEALTHY_FAT',
      labelEs: 'Grasas Saludables',
      triedCount: 0,
      totalCount: 5,
      percentage: 0,
      foods: [],
    }
    expect(progress.triedCount).toBe(0)
    expect(progress.percentage).toBe(0)
    expect(progress.foods).toHaveLength(0)
  })
})

describe('RoadmapFood type contract', () => {
  it('supports tried, pending, and rejected statuses', () => {
    const tried: RoadmapFood = { foodId: 'f1', name: 'A', status: 'tried' }
    const pending: RoadmapFood = { foodId: 'f2', name: 'B', status: 'pending' }
    const rejected: RoadmapFood = { foodId: 'f3', name: 'C', status: 'rejected' }
    expect(tried.status).toBe('tried')
    expect(pending.status).toBe('pending')
    expect(rejected.status).toBe('rejected')
  })
})

describe('BalanceInsight type contract', () => {
  it('accepts balanced state', () => {
    const insight: BalanceInsight = {
      label: 'balanced',
      labelEs: 'Mayormente equilibrada',
      severity: 'green',
      tip: 'La avena es suave para el estómago.',
    }
    expect(insight.label).toBe('balanced')
    expect(insight.severity).toBe('green')
  })

  it('accepts astringent state', () => {
    const insight: BalanceInsight = {
      label: 'astringent',
      labelEs: 'Mayormente astringente',
      severity: 'yellow',
      tip: 'Las frutas como la manzana aportan fibra natural.',
    }
    expect(insight.label).toBe('astringent')
    expect(insight.severity).toBe('yellow')
  })

  it('accepts laxative state', () => {
    const insight: BalanceInsight = {
      label: 'laxative',
      labelEs: 'Mayormente laxante',
      severity: 'red',
      tip: 'El camote es nutritivo y de sabor dulce natural.',
    }
    expect(insight.label).toBe('laxative')
    expect(insight.severity).toBe('red')
  })
})

describe('MealSlot type contract', () => {
  it('accepts registered meal slot', () => {
    const slot: MealSlot = {
      mealType: MealType.BREAKFAST,
      label: 'Desayuno',
      icon: '🌅',
      isRegistered: true,
      registeredTime: '08:30',
      foodCount: 2,
    }
    expect(slot.mealType).toBe(MealType.BREAKFAST)
    expect(slot.isRegistered).toBe(true)
    expect(slot.foodCount).toBe(2)
  })

  it('accepts pending meal slot with null time', () => {
    const slot: MealSlot = {
      mealType: MealType.DINNER,
      label: 'Cena',
      icon: '🌙',
      isRegistered: false,
      registeredTime: null,
      foodCount: 0,
    }
    expect(slot.isRegistered).toBe(false)
    expect(slot.registeredTime).toBeNull()
  })
})
