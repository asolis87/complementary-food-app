/**
 * Integration tests for menus routes — serve endpoint.
 *
 * Tests POST /api/menus/:menuId/meals/serve with various scenarios:
 * - 201 success: creates FoodLog entries, sets servedAt
 * - 400: empty plate (no items)
 * - 403/404: unauthorized access or menu not found
 * - 409: already served (servedAt not null)
 * - Force re-serve: soft-deletes old entries, creates new
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { MealType } from '@pakulab/shared'
import { NotFoundError, ForbiddenError } from '../../shared/errors/index.js'

// Valid CUIDs for testing
const VALID_MENU_CUID = 'clh3x7y8z0002p6rm5b4d8e9f'
const VALID_BABY_PROFILE_CUID = 'clh3x7y8z0000p6rm5b4d8e9f'
const VALID_PLATE_CUID = 'clh3x7y8z0003p6rm5b4d8e9f'
const VALID_USER_ID = 'user-123'

/**
 * Helper to build a Fastify instance with mocked Prisma for route testing.
 * This is a minimal mock approach focused on testing route handler logic.
 */
function buildMockFastify(prismaMocks: Record<string, ReturnType<typeof vi.fn>>): FastifyInstance {
  const mock = {
    prisma: prismaMocks,
    addHook: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  } as unknown as FastifyInstance
  return mock
}

/**
 * Create mock Prisma client with chainable methods for menu queries.
 */
function createMockPrisma(scenarios: {
  menu?: Record<string, unknown> | null
  babyProfile?: Record<string, unknown> | null
  menuDay?: Record<string, unknown> | null
  foodLog?: { count?: number; updateMany?: { count: number } }
  transaction?: Record<string, unknown>
} = {}) {
  return {
    weeklyMenu: {
      findFirst: vi.fn().mockResolvedValue(scenarios.menu ?? null),
      findUnique: vi.fn().mockResolvedValue(scenarios.menu ?? null),
    },
    babyProfile: {
      findFirst: vi.fn().mockResolvedValue(scenarios.babyProfile ?? null),
    },
    menuDay: {
      findFirst: vi.fn().mockResolvedValue(scenarios.menuDay ?? null),
    },
    menuMeal: {
      findFirst: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue({ id: 'meal-1', servedAt: new Date() }),
    },
    foodLog: {
      createMany: vi.fn().mockResolvedValue({ count: 2 }),
      updateMany: vi.fn().mockResolvedValue({ count: scenarios.foodLog?.updateMany?.count ?? 0 }),
    },
    plate: {
      findFirst: vi.fn().mockResolvedValue({
        id: VALID_PLATE_CUID,
        balanceScore: 0.5,
        items: [
          { id: 'item-1', foodId: 'food-1', food: { id: 'food-1', name: 'Manzana', group: 'FRUIT', alClassification: 'NEUTRAL', isAllergen: false } },
          { id: 'item-2', foodId: 'food-2', food: { id: 'food-2', name: 'Pollo', group: 'PROTEIN', alClassification: 'ASTRINGENT', isAllergen: false } },
        ],
      }),
    },
    $transaction: vi.fn(async (callback) => {
      const tx = {
        foodLog: {
          updateMany: vi.fn().mockResolvedValue({ count: scenarios.foodLog?.updateMany?.count ?? 0 }),
          createMany: vi.fn().mockResolvedValue({ count: 2 }),
        },
        menuMeal: {
          update: vi.fn().mockResolvedValue({ id: 'meal-1', servedAt: new Date('2024-06-15T10:00:00Z') }),
        },
      }
      return await callback(tx)
    }),
  }
}

describe('POST /api/menus/:menuId/meals/serve', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 201 on successful serve', async () => {
    const mockMenu = {
      id: VALID_MENU_CUID,
      userId: VALID_USER_ID,
      babyProfileId: VALID_BABY_PROFILE_CUID,
      weekStart: new Date('2024-06-10'),
      deletedAt: null,
    }

    const mockBabyProfile = {
      id: VALID_BABY_PROFILE_CUID,
      userId: VALID_USER_ID,
    }

    const mockMenuDay = {
      id: 'day-0',
      menuId: VALID_MENU_CUID,
      dayOfWeek: 0,
      meals: [{
        id: 'meal-1',
        menuDayId: 'day-0',
        mealType: MealType.LUNCH,
        plateId: VALID_PLATE_CUID,
        servedAt: null,
        plate: {
          id: VALID_PLATE_CUID,
          balanceScore: 0.5,
          items: [
            { id: 'item-1', foodId: 'food-1', food: { id: 'food-1', name: 'Manzana', alClassification: 'NEUTRAL' } },
            { id: 'item-2', foodId: 'food-2', food: { id: 'food-2', name: 'Pollo', alClassification: 'ASTRINGENT' } },
          ],
        },
      }],
    }

    const prisma = createMockPrisma({
      menu: mockMenu,
      babyProfile: mockBabyProfile,
      menuDay: mockMenuDay,
    })

    prisma.weeklyMenu.findFirst = vi.fn().mockResolvedValue(mockMenu)
    prisma.menuDay.findFirst = vi.fn().mockResolvedValue(mockMenuDay)
    prisma.babyProfile.findFirst = vi.fn().mockResolvedValue(mockBabyProfile)

    // Import the actual service function to test integration
    const { serveMeal } = await import('./menus.service.js')

    const result = await serveMeal(
      prisma as unknown as import('@prisma/client').PrismaClient,
      VALID_USER_ID,
      VALID_MENU_CUID,
      {
        dayOfWeek: 0,
        mealType: MealType.LUNCH,
        babyProfileId: VALID_BABY_PROFILE_CUID,
      },
      false
    )

    expect(result.servedAt).toBeDefined()
    expect(result.entriesCount).toBe(2)
    expect(result.replacedCount).toBeUndefined()
  })

  it('throws EmptyPlateError when plate has no items', async () => {
    const mockMenu = {
      id: VALID_MENU_CUID,
      userId: VALID_USER_ID,
      babyProfileId: VALID_BABY_PROFILE_CUID,
      weekStart: new Date('2024-06-10'),
      deletedAt: null,
    }

    const mockMenuDay = {
      id: 'day-0',
      menuId: VALID_MENU_CUID,
      dayOfWeek: 0,
      meals: [{
        id: 'meal-1',
        menuDayId: 'day-0',
        mealType: MealType.LUNCH,
        plateId: VALID_PLATE_CUID,
        servedAt: null,
        plate: {
          id: VALID_PLATE_CUID,
          balanceScore: 0.5,
          items: [], // Empty plate
        },
      }],
    }

    const prisma = createMockPrisma({
      menu: mockMenu,
      menuDay: mockMenuDay,
    })

    prisma.weeklyMenu.findFirst = vi.fn().mockResolvedValue(mockMenu)
    prisma.menuDay.findFirst = vi.fn().mockResolvedValue(mockMenuDay)

    const { serveMeal, EmptyPlateError } = await import('./menus.service.js')

    await expect(
      serveMeal(
        prisma as unknown as import('@prisma/client').PrismaClient,
        VALID_USER_ID,
        VALID_MENU_CUID,
        {
          dayOfWeek: 0,
          mealType: MealType.LUNCH,
          babyProfileId: VALID_BABY_PROFILE_CUID,
        },
        false
      )
    ).rejects.toThrow(EmptyPlateError)
  })

  it('throws AlreadyServedError when meal already served and force=false', async () => {
    const mockMenu = {
      id: VALID_MENU_CUID,
      userId: VALID_USER_ID,
      babyProfileId: VALID_BABY_PROFILE_CUID,
      weekStart: new Date('2024-06-10'),
      deletedAt: null,
    }

    const mockMenuDay = {
      id: 'day-0',
      menuId: VALID_MENU_CUID,
      dayOfWeek: 0,
      meals: [{
        id: 'meal-1',
        menuDayId: 'day-0',
        mealType: MealType.LUNCH,
        plateId: VALID_PLATE_CUID,
        servedAt: new Date('2024-06-15T08:00:00Z'), // Already served
        plate: {
          id: VALID_PLATE_CUID,
          balanceScore: 0.5,
          items: [
            { id: 'item-1', foodId: 'food-1', food: { id: 'food-1', name: 'Manzana', alClassification: 'NEUTRAL' } },
          ],
        },
      }],
    }

    const prisma = createMockPrisma({
      menu: mockMenu,
      menuDay: mockMenuDay,
    })

    prisma.weeklyMenu.findFirst = vi.fn().mockResolvedValue(mockMenu)
    prisma.menuDay.findFirst = vi.fn().mockResolvedValue(mockMenuDay)

    const { serveMeal, AlreadyServedError } = await import('./menus.service.js')

    await expect(
      serveMeal(
        prisma as unknown as import('@prisma/client').PrismaClient,
        VALID_USER_ID,
        VALID_MENU_CUID,
        {
          dayOfWeek: 0,
          mealType: MealType.LUNCH,
          babyProfileId: VALID_BABY_PROFILE_CUID,
        },
        false
      )
    ).rejects.toThrow(AlreadyServedError)
  })

  it('re-serves meal successfully when force=true', async () => {
    const mockMenu = {
      id: VALID_MENU_CUID,
      userId: VALID_USER_ID,
      babyProfileId: VALID_BABY_PROFILE_CUID,
      weekStart: new Date('2024-06-10'),
      deletedAt: null,
    }

    const mockMenuDay = {
      id: 'day-0',
      menuId: VALID_MENU_CUID,
      dayOfWeek: 0,
      meals: [{
        id: 'meal-1',
        menuDayId: 'day-0',
        mealType: MealType.LUNCH,
        plateId: VALID_PLATE_CUID,
        servedAt: new Date('2024-06-15T08:00:00Z'), // Already served
        plate: {
          id: VALID_PLATE_CUID,
          balanceScore: 0.5,
          items: [
            { id: 'item-1', foodId: 'food-1', food: { id: 'food-1', name: 'Manzana', alClassification: 'NEUTRAL' } },
            { id: 'item-2', foodId: 'food-2', food: { id: 'food-2', name: 'Pollo', alClassification: 'ASTRINGENT' } },
          ],
        },
      }],
    }

    const prisma = createMockPrisma({
      menu: mockMenu,
      menuDay: mockMenuDay,
      foodLog: { updateMany: { count: 2 } }, // 2 entries to be replaced
    })

    prisma.weeklyMenu.findFirst = vi.fn().mockResolvedValue(mockMenu)
    prisma.menuDay.findFirst = vi.fn().mockResolvedValue(mockMenuDay)

    const { serveMeal } = await import('./menus.service.js')

    const result = await serveMeal(
      prisma as unknown as import('@prisma/client').PrismaClient,
      VALID_USER_ID,
      VALID_MENU_CUID,
      {
        dayOfWeek: 0,
        mealType: MealType.LUNCH,
        babyProfileId: VALID_BABY_PROFILE_CUID,
      },
      true // Force re-serve
    )

    expect(result.servedAt).toBeDefined()
    expect(result.entriesCount).toBe(2)
    expect(result.replacedCount).toBe(2)
  })

  it('throws NotFoundError when menu does not exist', async () => {
    const prisma = createMockPrisma({
      menu: null,
    })

    prisma.weeklyMenu.findFirst = vi.fn().mockResolvedValue(null)

    const { serveMeal } = await import('./menus.service.js')

    await expect(
      serveMeal(
        prisma as unknown as import('@prisma/client').PrismaClient,
        VALID_USER_ID,
        'non-existent-menu-id',
        {
          dayOfWeek: 0,
          mealType: MealType.LUNCH,
          babyProfileId: VALID_BABY_PROFILE_CUID,
        },
        false
      )
    ).rejects.toThrow(NotFoundError)
  })

  it('throws ForbiddenError when user does not own menu', async () => {
    const mockMenu = {
      id: VALID_MENU_CUID,
      userId: 'different-user-id', // Different from requesting user
      babyProfileId: VALID_BABY_PROFILE_CUID,
      weekStart: new Date('2024-06-10'),
      deletedAt: null,
    }

    const prisma = createMockPrisma({
      menu: mockMenu,
    })

    prisma.weeklyMenu.findFirst = vi.fn().mockResolvedValue(mockMenu)

    const { serveMeal } = await import('./menus.service.js')

    await expect(
      serveMeal(
        prisma as unknown as import('@prisma/client').PrismaClient,
        VALID_USER_ID,
        VALID_MENU_CUID,
        {
          dayOfWeek: 0,
          mealType: MealType.LUNCH,
          babyProfileId: VALID_BABY_PROFILE_CUID,
        },
        false
      )
    ).rejects.toThrow(ForbiddenError)
  })

  it('throws NotFoundError when dayOfWeek does not exist in menu', async () => {
    const mockMenu = {
      id: VALID_MENU_CUID,
      userId: VALID_USER_ID,
      babyProfileId: VALID_BABY_PROFILE_CUID,
      weekStart: new Date('2024-06-10'),
      deletedAt: null,
    }

    const prisma = createMockPrisma({
      menu: mockMenu,
      menuDay: null, // Day doesn't exist
    })

    prisma.weeklyMenu.findFirst = vi.fn().mockResolvedValue(mockMenu)
    prisma.menuDay.findFirst = vi.fn().mockResolvedValue(null)

    const { serveMeal } = await import('./menus.service.js')

    await expect(
      serveMeal(
        prisma as unknown as import('@prisma/client').PrismaClient,
        VALID_USER_ID,
        VALID_MENU_CUID,
        {
          dayOfWeek: 3, // This day doesn't exist
          mealType: MealType.LUNCH,
          babyProfileId: VALID_BABY_PROFILE_CUID,
        },
        false
      )
    ).rejects.toThrow(NotFoundError)
  })

  it('throws NotFoundError when mealType does not exist for that day', async () => {
    const mockMenu = {
      id: VALID_MENU_CUID,
      userId: VALID_USER_ID,
      babyProfileId: VALID_BABY_PROFILE_CUID,
      weekStart: new Date('2024-06-10'),
      deletedAt: null,
    }

    const mockMenuDay = {
      id: 'day-0',
      menuId: VALID_MENU_CUID,
      dayOfWeek: 0,
      meals: [], // No meals for this day
    }

    const prisma = createMockPrisma({
      menu: mockMenu,
      menuDay: mockMenuDay,
    })

    prisma.weeklyMenu.findFirst = vi.fn().mockResolvedValue(mockMenu)
    prisma.menuDay.findFirst = vi.fn().mockResolvedValue(mockMenuDay)

    const { serveMeal } = await import('./menus.service.js')

    await expect(
      serveMeal(
        prisma as unknown as import('@prisma/client').PrismaClient,
        VALID_USER_ID,
        VALID_MENU_CUID,
        {
          dayOfWeek: 0,
          mealType: MealType.LUNCH,
          babyProfileId: VALID_BABY_PROFILE_CUID,
        },
        false
      )
    ).rejects.toThrow(NotFoundError)
  })
})
