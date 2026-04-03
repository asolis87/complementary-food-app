/**
 * Menus service layer — business logic for weekly menu planner.
 *
 * Spec: REQ-MENU-01 — Pro-only weekly menu planner with lazy creation,
 * per-slot PATCH, and computed balance scores.
 */

import type { FastifyInstance } from 'fastify'
import type {
  WeeklyMenuResponse,
  MenuDayResponse,
  MenuMealResponse,
  MealSlotPatch,
  CreateMenuPayload,
  PlateItemSummary,
  ServeMealPayload,
  ServeMealResponse,
} from '@pakulab/shared'
import { MealType, derivePlateBalanceLabel } from '@pakulab/shared'
import type { PrismaClient, WeeklyMenu, MenuDay, MenuMeal, Plate, Food, ALClassification } from '@prisma/client'
import { NotFoundError, ForbiddenError, ConflictError, AppError } from '../../shared/errors/index.js'

// =============================================================================
// Types
// =============================================================================

/** Transaction client type for Prisma interactive transactions */
type TxClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

type PlateWithItems = Plate & {
  items?: ({
    id: string
    plateId: string
    foodId: string
    groupAssignment: string
    food: Pick<Food, 'id' | 'name' | 'group' | 'alClassification' | 'isAllergen'> | null
  })[]
}

type MenuMealWithServedAt = MenuMeal & {
  servedAt: Date | null
  plate: PlateWithItems | null
}

type MenuWithDaysAndMeals = WeeklyMenu & {
  days: (MenuDay & {
    meals: MenuMealWithServedAt[]
  })[]
}

// =============================================================================
// Ownership Guards
// =============================================================================

/**
 * Asserts that the user owns the baby profile.
 * Throws 403 if not owned or not found.
 */
export async function assertOwnedBabyProfile(
  prisma: PrismaClient,
  userId: string,
  babyProfileId: string,
): Promise<void> {
  const profile = await prisma.babyProfile.findFirst({
    where: { id: babyProfileId, userId, deletedAt: null },
    select: { id: true },
  })

  if (!profile) {
    throw new ForbiddenError('You do not have access to this baby profile')
  }
}

/**
 * Asserts that the user owns the menu.
 * Returns the menu if owned, throws 403 if owned by another user, 404 if not found.
 */
export async function assertOwnedMenu(
  prisma: PrismaClient,
  userId: string,
  menuId: string,
): Promise<WeeklyMenu> {
  // First find the menu by id only (to check existence vs ownership separately)
  const menu = await prisma.weeklyMenu.findFirst({
    where: { id: menuId, deletedAt: null },
  })

  if (!menu) {
    throw new NotFoundError('Menu')
  }

  // Check ownership - if menu exists but belongs to another user
  if (menu.userId !== userId) {
    throw new ForbiddenError('You do not have access to this menu')
  }

  return menu
}

// =============================================================================
// Balance Score Computation
// =============================================================================

/**
 * Computes the average balance score of all assigned plates in a menu.
 * Returns null if no plates are assigned.
 */
export function computeBalanceScore(menu: MenuWithDaysAndMeals): number | null {
  let totalScore = 0
  let plateCount = 0

  for (const day of menu.days) {
    for (const meal of day.meals) {
      if (meal.plateId && meal.plate) {
        totalScore += meal.plate.balanceScore
        plateCount++
      }
    }
  }

  if (plateCount === 0) return null
  return totalScore / plateCount
}

// =============================================================================
// Serialization
// =============================================================================

/**
 * Serializes plate items to PlateItemSummary format.
 */
function serializePlateItems(items: PlateWithItems['items'] | undefined): PlateItemSummary[] | undefined {
  if (!items) return undefined
  return items.map((item) => ({
    id: item.id,
    foodId: item.foodId,
    groupAssignment: item.groupAssignment as import('@pakulab/shared').FoodGroup,
    food: item.food
      ? {
          id: item.food.id,
          name: item.food.name,
          group: item.food.group,
          alClassification: item.food.alClassification,
          isAllergen: item.food.isAllergen,
        }
      : undefined,
  }))
}

/**
 * Serializes a Prisma MenuMeal to the API response type.
 */
function serializeMenuMeal(meal: MenuMeal & { plate: PlateWithItems | null }): MenuMealResponse {
  return {
    id: meal.id,
    menuDayId: meal.menuDayId,
    mealType: meal.mealType as MealType,
    plateId: meal.plateId,
    notes: meal.notes,
    servedAt: meal.servedAt?.toISOString() ?? null,
    plate: meal.plate
      ? {
          id: meal.plate.id,
          userId: meal.plate.userId,
          babyProfileId: meal.plate.babyProfileId ?? undefined,
          name: meal.plate.name,
          groupCount: meal.plate.groupCount as 4 | 5,
          balanceScore: meal.plate.balanceScore,
          astringentCount: meal.plate.astringentCount,
          laxativeCount: meal.plate.laxativeCount,
          neutralCount: meal.plate.neutralCount,
          createdAt: meal.plate.createdAt.toISOString(),
          updatedAt: meal.plate.updatedAt.toISOString(),
          deletedAt: meal.plate.deletedAt?.toISOString(),
          items: serializePlateItems(meal.plate.items) as unknown as import('@pakulab/shared').PlateItem[],
        }
      : null,
  }
}

/**
 * Serializes a Prisma MenuDay to the API response type.
 */
function serializeMenuDay(day: MenuDay & { meals: (MenuMeal & { plate: PlateWithItems | null })[] }): MenuDayResponse {
  return {
    id: day.id,
    menuId: day.menuId,
    dayOfWeek: day.dayOfWeek,
    createdAt: day.createdAt.toISOString(),
    meals: day.meals.map(serializeMenuMeal),
  }
}

/**
 * Serializes a Prisma WeeklyMenu with nested days/meals to the API response type.
 * Computes the balance score from assigned plates.
 */
export function serializeMenu(menu: MenuWithDaysAndMeals): WeeklyMenuResponse {
  // Sort days by dayOfWeek to ensure consistent order
  const sortedDays = [...menu.days].sort((a, b) => a.dayOfWeek - b.dayOfWeek)

  return {
    id: menu.id,
    userId: menu.userId,
    babyProfileId: menu.babyProfileId,
    weekStart: menu.weekStart.toISOString().slice(0, 10), // YYYY-MM-DD
    balanceScore: computeBalanceScore(menu),
    createdAt: menu.createdAt.toISOString(),
    updatedAt: menu.updatedAt.toISOString(),
    days: sortedDays.map(serializeMenuDay),
  }
}

// =============================================================================
// Main Service Functions
// =============================================================================

/**
 * Gets the weekly menu for a specific baby profile and week.
 * Returns null if no menu exists (lazy creation — frontend decides to create).
 */
export async function getWeekMenu(
  prisma: PrismaClient,
  userId: string,
  babyProfileId: string,
  weekStart: string,
): Promise<WeeklyMenuResponse | null> {
  // Verify ownership first
  await assertOwnedBabyProfile(prisma, userId, babyProfileId)

  const menu = await prisma.weeklyMenu.findFirst({
    where: {
      userId,
      babyProfileId,
      weekStart: new Date(weekStart),
      deletedAt: null,
    },
    include: {
      days: {
        include: {
          meals: {
            include: {
              plate: {
                include: {
                  items: {
                    include: {
                      food: { select: { id: true, name: true, group: true, alClassification: true, isAllergen: true } }
                    }
                  }
                }
              }
            },
          },
        },
       },
     },
  })

  if (!menu) return null

  return serializeMenu(menu)
}

/**
 * Creates a new weekly menu with exactly 7 days.
 * Fails if a menu already exists for this user/profile/week combination.
 */
export async function createWeekMenu(
  prisma: PrismaClient,
  userId: string,
  payload: CreateMenuPayload,
): Promise<WeeklyMenuResponse> {
  // Verify ownership
  await assertOwnedBabyProfile(prisma, userId, payload.babyProfileId)

  // Check for duplicate menu
  const existing = await prisma.weeklyMenu.findFirst({
    where: {
      userId,
      babyProfileId: payload.babyProfileId,
      weekStart: new Date(payload.weekStart),
      deletedAt: null,
    },
    select: { id: true },
  })

  if (existing) {
    throw new ConflictError('A menu already exists for this week')
  }

  // Create menu with 7 days in a transaction
  const menu = await prisma.$transaction(async (tx: TxClient) => {
    return tx.weeklyMenu.create({
      data: {
        userId,
        babyProfileId: payload.babyProfileId,
        weekStart: new Date(payload.weekStart),
        // Auto-create 7 days (0 = Monday, 6 = Sunday)
        days: {
          create: Array.from({ length: 7 }, (_, i) => ({
            dayOfWeek: i,
          })),
        },
      },
       include: {
         days: {
           include: {
             meals: {
               include: {
                 plate: {
                   include: {
                     items: {
                       include: {
                          food: { select: { id: true, name: true, group: true, alClassification: true, isAllergen: true } }
                       }
                     }
                   }
                 }
               },
             },
           },
         },
       },
     })
  })

  return serializeMenu(menu)
}

/**
 * Upserts a meal slot — assigns, replaces, or clears a plate for a specific day+mealType.
 * Creates the MenuDay defensively if it doesn't exist (shouldn't happen, but for data integrity).
 * Fully transactional: MenuDay ensure + MenuMeal upsert are in one transaction.
 */
export async function upsertMealSlot(
  prisma: PrismaClient,
  userId: string,
  menuId: string,
  payload: MealSlotPatch,
): Promise<{ meal: MenuMealResponse | null; balanceScore: number | null }> {
  // Verify menu ownership (outside transaction - ownership check is fast and shouldn't be rolled back)
  const menu = await assertOwnedMenu(prisma, userId, menuId)

  // If assigning a plate, verify it exists and belongs to user (outside transaction)
  if (payload.plateId) {
    const plate = await prisma.plate.findFirst({
      where: {
        id: payload.plateId,
        userId,
        deletedAt: null,
      },
      select: { id: true },
    })

    if (!plate) {
      throw new NotFoundError('Plate')
    }
  }

  // Everything below runs in a single transaction for data integrity
  const result = await prisma.$transaction(async (tx: TxClient) => {
    // Find or create the MenuDay for this dayOfWeek (inside transaction)
    let menuDay = await tx.menuDay.findFirst({
      where: {
        menuId,
        dayOfWeek: payload.dayOfWeek,
      },
    })

    // Defensive creation: if MenuDay doesn't exist, create it inside the transaction
    if (!menuDay) {
      menuDay = await tx.menuDay.create({
        data: {
          menuId,
          dayOfWeek: payload.dayOfWeek,
        },
      })
    }

    if (payload.plateId === null) {
      // Clear slot: delete the MenuMeal if it exists
      await tx.menuMeal.deleteMany({
        where: {
          menuDayId: menuDay.id,
          mealType: payload.mealType,
        },
      })

      return { meal: null }
    } else {
      // Assign/replace plate: upsert the MenuMeal
      const meal = await tx.menuMeal.upsert({
        where: {
          menuDayId_mealType: {
            menuDayId: menuDay.id,
            mealType: payload.mealType,
          },
        },
        update: {
          plateId: payload.plateId,
          ...(payload.notes !== undefined && { notes: payload.notes }),
        },
        create: {
          menuDayId: menuDay.id,
          mealType: payload.mealType,
          plateId: payload.plateId,
          notes: payload.notes ?? null,
        },
         include: {
           plate: {
             include: {
               items: {
                 include: {
                    food: { select: { id: true, name: true, group: true, alClassification: true, isAllergen: true } }
                 }
               }
             }
           }
         },
       })

       return { meal }
     }
   })

   // Re-fetch the full menu to compute the new balance score (outside transaction)
   const updatedMenu = await prisma.weeklyMenu.findFirst({
     where: { id: menuId },
     include: {
       days: {
         include: {
           meals: {
             include: {
               plate: {
                 include: {
                   items: {
                     include: {
                        food: { select: { id: true, name: true, group: true, alClassification: true, isAllergen: true } }
                     }
                   }
                 }
               }
             },
           },
         },
       },
     },
   })

   const balanceScore = updatedMenu ? computeBalanceScore(updatedMenu) : null

   return {
     meal: result.meal ? serializeMenuMeal(result.meal) : null,
     balanceScore,
   }
 }

/**
 * Soft-deletes a menu by setting deletedAt timestamp.
 */
export async function softDeleteMenu(
  prisma: PrismaClient,
  userId: string,
  menuId: string,
): Promise<void> {
  // Verify ownership (will throw if not found or not owned)
  await assertOwnedMenu(prisma, userId, menuId)

  await prisma.weeklyMenu.update({
    where: { id: menuId },
    data: { deletedAt: new Date() },
  })
}

// =============================================================================
// Serve Meal — Convert menu meal to FoodLog entries
// =============================================================================

/**
 * Custom error for already-served meals.
 * Includes the servedAt timestamp so client can show when it was served.
 */
export class AlreadyServedError extends AppError {
  constructor(public readonly servedAt: Date) {
    super('Esta comida ya fue servida', 409, 'ALREADY_SERVED')
  }
}

/**
 * Custom error for empty plates.
 */
export class EmptyPlateError extends AppError {
  constructor() {
    super('El plato no tiene alimentos para registrar', 400, 'EMPTY_PLATE')
  }
}

/**
 * Computes the UTC date for a given weekStart (Monday) and dayOfWeek offset.
 * 
 * @param weekStartStr - ISO date string YYYY-MM-DD, must be a Monday
 * @param dayOfWeek - 0-6 offset from Monday
 * @returns Date object in UTC for that day
 */
function computeServeDate(weekStartStr: string, dayOfWeek: number): Date {
  // Parse the weekStart as UTC to avoid timezone issues
  const match = weekStartStr.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) {
    throw new Error('Invalid weekStart format, expected YYYY-MM-DD')
  }

  const [, yearStr, monthStr, dayStr] = match
  const year = parseInt(yearStr!, 10)
  const month = parseInt(monthStr!, 10) - 1 // 0-indexed
  const day = parseInt(dayStr!, 10)

  // Create UTC date for the Monday of that week
  const weekStart = new Date(Date.UTC(year, month, day))

  // Add dayOfWeek days to get the target date
  const targetDate = new Date(weekStart)
  targetDate.setUTCDate(weekStart.getUTCDate() + dayOfWeek)

  return targetDate
}

/**
 * Serves a meal from the menu — converts plate items into FoodLog entries.
 * 
 * Flow:
 * 1. Verify menu ownership
 * 2. Find MenuDay by menuId + dayOfWeek
 * 3. Find MenuMeal with plate.items.food
 * 4. Check if already served (409 if servedAt set and !force)
 * 5. If force=true: soft-delete existing FoodLogs
 * 6. Compute UTC date from weekStart + dayOfWeek
 * 7. Compute plateBalanceLabel from plate.balanceScore
 * 8. Create FoodLog entries for each plate item
 * 9. Set MenuMeal.servedAt = NOW()
 * 10. Return served info
 * 
 * @throws AlreadyServedError if meal already served and force=false
 * @throws EmptyPlateError if plate has no items
 * @throws NotFoundError if menu, day, or meal not found
 * @throws ForbiddenError if user doesn't own the menu
 */
export async function serveMeal(
  prisma: PrismaClient,
  userId: string,
  menuId: string,
  payload: ServeMealPayload,
  force: boolean = false,
): Promise<ServeMealResponse> {
  // Step 1: Verify menu ownership and get menu details
  const menu = await assertOwnedMenu(prisma, userId, menuId)

  // Step 1b: Verify babyProfileId ownership (security check)
  await assertOwnedBabyProfile(prisma, userId, payload.babyProfileId)

  // Step 2 & 3: Find MenuDay and MenuMeal with plate items in a single query
  const menuDay = await prisma.menuDay.findFirst({
    where: {
      menuId,
      dayOfWeek: payload.dayOfWeek,
    },
    include: {
      meals: {
        where: {
          mealType: payload.mealType,
        },
        include: {
          plate: {
            include: {
              items: {
                include: {
                   food: { select: { id: true, name: true, group: true, alClassification: true, isAllergen: true } }
                }
              }
            }
          }
        }
      }
    }
  })

  if (!menuDay || menuDay.meals.length === 0) {
    throw new NotFoundError('Comida')
  }

  const menuMeal = menuDay.meals[0]!

  // Check if there's a plate assigned
  if (!menuMeal.plateId || !menuMeal.plate) {
    throw new NotFoundError('No hay plato asignado a esta comida')
  }

  const plate = menuMeal.plate

  // Step 4: Check servedAt status
  if (menuMeal.servedAt && !force) {
    throw new AlreadyServedError(menuMeal.servedAt)
  }

  // Compute the serve date (needed for both soft-delete and create)
  const serveDate = computeServeDate(menu.weekStart.toISOString().slice(0, 10), payload.dayOfWeek)

  // Step 5 & 6 & 7 & 8 & 9: All database mutations in a single transaction
  const result = await prisma.$transaction(async (tx: TxClient) => {
    let replacedCount = 0

    // If force=true and meal was already served, soft-delete old FoodLogs
    // Scoped by the ACTUAL diary entries: date + mealType + babyProfile (plate may have changed)
    if (menuMeal.servedAt && force) {
      const deletedLogs = await tx.foodLog.updateMany({
        where: {
          userId,
          babyProfileId: payload.babyProfileId,
          date: serveDate,
          mealType: payload.mealType,
          deletedAt: null,
        },
        data: {
          deletedAt: new Date(),
        },
      })
      replacedCount = deletedLogs.count
    }

    // Check for empty plate
    if (!plate.items || plate.items.length === 0) {
      throw new EmptyPlateError()
    }

    // Compute plate balance label
    const plateBalanceLabel = derivePlateBalanceLabel(plate.balanceScore)

    // Create FoodLog entries for each plate item
    const foodLogData = plate.items.map((item) => ({
      userId,
      babyProfileId: payload.babyProfileId,
      foodId: item.foodId,
      date: serveDate,
      mealType: payload.mealType,
      plateId: plate.id,
      plateBalanceLabel,
      // reaction, accepted, notes are null — filled during review moment
    }))

    await tx.foodLog.createMany({
      data: foodLogData,
    })

    // Update MenuMeal.servedAt
    const updatedMeal = await tx.menuMeal.update({
      where: { id: menuMeal.id },
      data: { servedAt: new Date() },
    })

    return {
      servedAt: updatedMeal.servedAt!,
      entriesCount: foodLogData.length,
      replacedCount: force ? replacedCount : undefined,
    }
  })

  return {
    servedAt: result.servedAt.toISOString(),
    entriesCount: result.entriesCount,
    ...(result.replacedCount !== undefined && { replacedCount: result.replacedCount }),
  }
}
