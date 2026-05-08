/**
 * Dashboard service — business logic for the actionable dashboard.
 *
 * Aggregates data from diary, foods, profiles, and allergen modules
 * into consolidated dashboard responses.
 *
 * Spec: REQ-DASH-BIZ-01 through REQ-DASH-BIZ-05
 */

import type { PrismaClient, Prisma, Food } from '@prisma/client'
import {
  calculateBalance,
  getBalanceSeverity,
  BALANCE_TIPS,
  FOOD_GROUP_LABELS_DASHBOARD,
  DASHBOARD_MEAL_SLOTS,
  DEFAULT_SUGGESTIONS_LIMIT,
  SUGGESTION_LOOKBACK_DAYS,
  ALLERGEN_AGE_THRESHOLDS,
  DEFAULT_ALLERGEN_MIN_AGE_MONTHS,
  CLOSING_WINDOW_AGE_MONTHS,
  ageInMonths,
} from '@pakulab/shared'
import type {
  DashboardData,
  BabyContext,
  TodayLog,
  SuggestedFood,
  AllergenAlert,
  RoadmapProgress,
  BalanceInsight,
  MealSlot,
  FoodGroup,
} from '@pakulab/shared'
import type { FoodForSuggestion, FoodLogWithFood, FoodWithReaction } from './dashboard.types.js'

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Aggregates all dashboard data into a single consolidated response.
 *
 * @param prisma - Prisma client instance
 * @param userId - Authenticated user ID
 * @param babyProfileId - Selected baby profile ID
 * @param userTier - User's subscription tier
 * @returns Consolidated dashboard data
 */
export async function getDashboardData(
  prisma: PrismaClient,
  userId: string,
  babyProfileId: string,
  userTier: 'FREE' | 'PRO' = 'PRO',
): Promise<DashboardData> {
  const profile = await prisma.babyProfile.findFirst({
    where: { id: babyProfileId, userId, deletedAt: null },
  })

  if (!profile) {
    throw new Error('Perfil no encontrado')
  }

  const { ageInMonths: babyAgeMonths, daysInAC } = calculateAgeAndDaysInAC(
    profile.birthDate,
    profile.acStartDate,
  )

  const baby: BabyContext = {
    id: profile.id,
    name: profile.name,
    ageInMonths: babyAgeMonths,
    daysInAC,
  }

  // Run independent queries in parallel
  const [todayResult, suggestedFoods, pendingAllergens, roadmapProgress, weeklyBalance] =
    await Promise.all([
      getTodayLogs(prisma, babyProfileId),
      getSuggestedFoods(prisma, babyProfileId, babyAgeMonths),
      getPendingAllergens(prisma, babyProfileId, babyAgeMonths),
      getRoadmapProgress(prisma, babyProfileId, babyAgeMonths),
      getWeeklyBalance(prisma, babyProfileId),
    ])

  return {
    baby,
    userTier,
    todayLogs: todayResult.logs,
    suggestedFoods,
    pendingAllergens,
    roadmapProgress,
    weeklyBalance,
  }
}

// ── Today's Logs ──────────────────────────────────────────────────────────────

/**
 * Returns today's food log entries grouped by meal type.
 *
 * Spec: REQ-DASH-05
 */
export async function getTodayLogs(
  prisma: PrismaClient,
  babyProfileId: string,
): Promise<{ logs: TodayLog[]; mealSlots: MealSlot[] }> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const logs = await prisma.foodLog.findMany({
    where: {
      babyProfileId,
      date: { gte: today, lt: tomorrow },
      deletedAt: null,
    },
    include: { food: true },
    orderBy: { time: 'asc' },
  })

  const todayLogs: TodayLog[] = logs.map((log) => ({
    id: log.id,
    mealType: log.mealType as unknown as TodayLog['mealType'],
    time: log.time,
    foodId: log.foodId,
    foodName: log.food.name,
    foodGroup: log.food.group as unknown as TodayLog['foodGroup'],
    reaction: log.reaction as unknown as TodayLog['reaction'],
    notes: log.notes,
  }))

  // Build meal slots from DASHBOARD_MEAL_SLOTS
  const mealSlots: MealSlot[] = DASHBOARD_MEAL_SLOTS.map((slot) => {
    const slotLogs = logs.filter((l) => l.mealType === slot.mealType)
    const isRegistered = slotLogs.length > 0
    const registeredTime =
      slotLogs.length > 0
        ? slotLogs.reduce(
            (earliest, l) => (!earliest || (l.time && l.time < earliest) ? l.time : earliest),
            slotLogs[0]!.time,
          )
        : null

    return {
      mealType: slot.mealType,
      label: slot.label,
      icon: slot.icon,
      isRegistered,
      registeredTime,
      foodCount: slotLogs.length,
    }
  })

  return { logs: todayLogs, mealSlots }
}

// ── Food Suggestions ──────────────────────────────────────────────────────────

/**
 * Returns food suggestions for the baby's profile.
 *
 * Spec: REQ-DASH-02, REQ-DASH-BIZ-01
 */
export async function getSuggestedFoods(
  prisma: PrismaClient,
  babyProfileId: string,
  babyAgeMonths: number,
  limit: number = DEFAULT_SUGGESTIONS_LIMIT,
): Promise<SuggestedFood[]> {
  // Get age-appropriate foods
  const foods = (await prisma.food.findMany({
    where: { ageMonths: { lte: babyAgeMonths } },
  })) as FoodForSuggestion[]

  if (foods.length === 0) return []

  // Get foods tried in the last 30 days
  const lookbackDate = new Date()
  lookbackDate.setDate(lookbackDate.getDate() - SUGGESTION_LOOKBACK_DAYS)

  const recentLogs = await prisma.foodLog.findMany({
    where: {
      babyProfileId,
      date: { gte: lookbackDate },
      deletedAt: null,
    },
    select: { foodId: true },
  })

  const recentlyTriedFoodIds = new Set(recentLogs.map((l) => l.foodId))

  // Filter out recently tried foods
  const candidateFoods = foods.filter((f) => !recentlyTriedFoodIds.has(f.id))

  // Sort and limit
  const sorted = sortSuggestions(candidateFoods, recentlyTriedFoodIds, limit)

  // Map to response type
  return sorted.map((food) => ({
    foodId: food.id,
    name: food.name,
    group: food.group,
    ageMonths: food.ageMonths,
    benefit: deriveBenefit(food),
    isAllergen: food.isAllergen,
    allergenType: food.allergenType,
    status: recentlyTriedFoodIds.has(food.id) ? 'tried' : 'pending',
  }))
}

// ── Pending Allergens ─────────────────────────────────────────────────────────

/**
 * Returns allergens not yet introduced for the baby.
 *
 * Spec: REQ-DASH-03, REQ-DASH-BIZ-02
 */
export async function getPendingAllergens(
  prisma: PrismaClient,
  babyProfileId: string,
  babyAgeMonths: number,
): Promise<AllergenAlert[]> {
  // Only show allergens if baby is >= 6 months
  if (babyAgeMonths < DEFAULT_ALLERGEN_MIN_AGE_MONTHS) {
    return []
  }

  // Get foods that are allergens and have been tried by this baby
  const allergenLogs = await prisma.foodLog.findMany({
    where: {
      babyProfileId,
      food: { isAllergen: true },
      reaction: { notIn: ['REJECTED'] },
      deletedAt: null,
    },
    include: { food: { select: { allergenType: true } } },
  })

  const triedAllergenTypes = new Set(
    allergenLogs
      .map((l) => l.food.allergenType)
      .filter((t): t is string => t !== null),
  )

  return buildAllergenAlerts(babyAgeMonths, [...triedAllergenTypes])
}

// ── Roadmap Progress ──────────────────────────────────────────────────────────

/**
 * Returns food progress grouped by category.
 *
 * Spec: REQ-DASH-04, REQ-DASH-BIZ-03
 */
export async function getRoadmapProgress(
  prisma: PrismaClient,
  babyProfileId: string,
  babyAgeMonths: number,
): Promise<RoadmapProgress[]> {
  // Get age-appropriate foods with their group
  const foods = await prisma.food.findMany({
    where: { ageMonths: { lte: babyAgeMonths } },
    select: { id: true, name: true, group: true },
  })

  // Get all food logs for this baby
  const logs = await prisma.foodLog.findMany({
    where: { babyProfileId, deletedAt: null },
    include: { food: { select: { id: true, name: true, group: true } } },
    orderBy: { date: 'desc' },
  })

  // Build a map of foodId → reaction for quick lookup
  const foodReactionMap = new Map<string, FoodWithReaction>()
  for (const log of logs) {
    if (!foodReactionMap.has(log.foodId)) {
      foodReactionMap.set(log.foodId, {
        foodId: log.foodId,
        name: log.food.name,
        reaction: log.reaction,
        date: log.date,
      })
    }
  }

  // Group foods by FoodGroup
  const groups = ['FRUIT', 'VEGETABLE', 'PROTEIN', 'CEREAL_TUBER', 'HEALTHY_FAT'] as FoodGroup[]

  return groups.map((group) => {
    const groupFoods = foods.filter((f) => f.group === group)
    const triedFoodIds = new Set(
      logs
        .filter((l) => l.food.group === group)
        .map((l) => l.foodId),
    )

    const groupStats = {
      group,
      triedCount: triedFoodIds.size,
      totalCount: groupFoods.length,
    }

    return computeRoadmapProgress(
      groupStats,
      groupFoods.length,
      foodReactionMap,
      FOOD_GROUP_LABELS_DASHBOARD[group],
      groupFoods, // Pass all foods in this group
    )
  })
}

// ── Weekly Balance ────────────────────────────────────────────────────────────

/**
 * Returns the A/L balance insight for the past 7 days.
 *
 * Spec: REQ-DASH-06, REQ-DASH-BIZ-04
 */
export async function getWeeklyBalance(
  prisma: PrismaClient,
  babyProfileId: string,
): Promise<BalanceInsight> {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  weekAgo.setHours(0, 0, 0, 0)

  const logs = await prisma.foodLog.findMany({
    where: {
      babyProfileId,
      date: { gte: weekAgo },
      deletedAt: null,
    },
    include: { food: { select: { alClassification: true } } },
  })

  return computeWeeklyBalance(logs)
}

// ── Pure Helper Functions ─────────────────────────────────────────────────────

/**
 * Select a random tip from the curated BALANCE_TIPS list.
 * MUST NOT generate tips dynamically.
 *
 * Spec: REQ-DASH-BIZ-05
 */
export function getRandomTip(): string {
  const index = Math.floor(Math.random() * BALANCE_TIPS.length)
  return BALANCE_TIPS[index] ?? BALANCE_TIPS[0]!
}

/**
 * Derive a human-readable benefit text from a food's properties.
 */
export function deriveBenefit(food: { group: FoodGroup; isAllergen: boolean; ageMonths: number }): string {
  if (food.isAllergen) {
    return 'Alérgeno común — ideal para esta edad'
  }

  switch (food.group) {
    case 'PROTEIN':
      return 'Alto en proteína'
    case 'FRUIT':
      return 'Aporta fibra natural'
    case 'VEGETABLE':
      return 'Fácil de digerir'
    case 'CEREAL_TUBER':
      return 'Fuente de energía sostenida'
    case 'HEALTHY_FAT':
      return 'Grasa saludable para el desarrollo'
    default:
      return 'Ideal para esta edad'
  }
}

/**
 * Calculate baby's age in months and days in complementary feeding.
 */
export function calculateAgeAndDaysInAC(
  birthDate: Date,
  acStartDate: Date | null,
): { ageInMonths: number; daysInAC: number } {
  const birthStr = birthDate.toISOString().split('T')[0]!
  const ageMonths = ageInMonths(birthStr)

  let daysInAC = 0
  if (acStartDate) {
    const now = new Date()
    const diffMs = now.getTime() - acStartDate.getTime()
    daysInAC = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  }

  return { ageInMonths: ageMonths, daysInAC }
}

/**
 * Sort suggested foods by priority:
 * 1. Pending allergens (highest priority)
 * 2. Foods from groups with less variety (lower tried ratio)
 * 3. Random within same priority tier
 *
 * Spec: REQ-DASH-BIZ-01
 */
export function sortSuggestions(
  foods: FoodForSuggestion[],
  recentlyTriedFoodIds: Set<string>,
  limit: number = DEFAULT_SUGGESTIONS_LIMIT,
): FoodForSuggestion[] {
  if (foods.length === 0) return []

  // Filter out recently tried foods
  const candidates = foods.filter((f) => !recentlyTriedFoodIds.has(f.id))

  // Sort: allergens first, then random (Fisher-Yates shuffle with priority)
  const sorted = [...candidates].sort((a, b) => {
    // Allergens have higher priority
    if (a.isAllergen && !b.isAllergen) return -1
    if (!a.isAllergen && b.isAllergen) return 1
    // Within same priority, randomize
    return Math.random() - 0.5
  })

  return sorted.slice(0, limit)
}

/**
 * Build allergen alerts based on baby's age and already-tried allergens.
 *
 * Spec: REQ-DASH-BIZ-02
 */
export function buildAllergenAlerts(
  babyAgeMonths: number,
  triedAllergenTypes: string[],
): AllergenAlert[] {
  if (babyAgeMonths < DEFAULT_ALLERGEN_MIN_AGE_MONTHS) {
    return []
  }

  const triedSet = new Set(triedAllergenTypes)
  const urgency: 'normal' | 'closing_window' =
    babyAgeMonths >= CLOSING_WINDOW_AGE_MONTHS ? 'closing_window' : 'normal'

  return ALLERGEN_AGE_THRESHOLDS.filter((a) => !triedSet.has(a.allergenKey)).map((a) => ({
    allergenKey: a.allergenKey,
    nameEs: a.nameEs,
    icon: a.icon,
    minAgeMonths: a.minAgeMonths,
    urgency,
  }))
}

/**
 * Compute roadmap progress for a single food group.
 *
 * Spec: REQ-DASH-BIZ-03
 */
export function computeRoadmapProgress(
  groupStats: { group: FoodGroup; triedCount: number; totalCount: number },
  totalFoodsAvailable: number,
  foodReactionMap: Map<string, FoodWithReaction>,
  labelEs: string,
  allFoodsInGroup: Array<{ id: string; name: string }> = [], // NEW: all foods in this group
): RoadmapProgress {
  const percentage =
    groupStats.totalCount > 0
      ? Math.round((groupStats.triedCount / groupStats.totalCount) * 100)
      : 0

  // Build foods array with ALL foods (tried + pending)
  const foods: RoadmapProgress['foods'] = []

  // If allFoodsInGroup is provided, use it to show ALL foods
  if (allFoodsInGroup.length > 0) {
    for (const food of allFoodsInGroup) {
      const reaction = foodReactionMap.get(food.id)
      const status: RoadmapProgress['foods'][number]['status'] = 
        reaction?.reaction === 'REJECTED' ? 'rejected' :
        reaction ? 'tried' : 'pending'
      
      foods.push({
        foodId: food.id,
        name: food.name,
        status,
      })
    }
  } else {
    // Fallback: only show tried foods (legacy behavior)
    const triedFoods: RoadmapProgress['foods'] = []
    for (const [foodId, info] of foodReactionMap) {
      const status = info.reaction === 'REJECTED' ? 'rejected' as const : 'tried' as const
      triedFoods.push({ foodId, name: info.name, status })
    }
    foods.push(...triedFoods.slice(0, 5))
  }

  return {
    group: groupStats.group,
    labelEs,
    triedCount: groupStats.triedCount,
    totalCount: groupStats.totalCount,
    percentage,
    foods,
  }
}

/**
 * Compute the weekly A/L balance insight from food logs.
 *
 * Spec: REQ-DASH-BIZ-04
 */
export function computeWeeklyBalance(
  logs: Array<{ food: { alClassification: string } }>,
): BalanceInsight {
  if (logs.length === 0) {
    return {
      label: 'balanced',
      labelEs: 'Sin datos suficientes',
      severity: 'green' as const,
      tip: getRandomTip(),
    }
  }

  const balanceResult = calculateBalance(
    logs.map((l) => ({ alClassification: l.food.alClassification as 'ASTRINGENT' | 'LAXATIVE' | 'NEUTRAL' })),
  )

  // Map Spanish label for dashboard display
  const labelEsMap: Record<string, string> = {
    Equilibrado: 'Mayormente equilibrada',
    'Más astringente': 'Mayormente astringente',
    'Más laxante': 'Mayormente laxante',
    'Muy astringente': 'Muy astringente',
    'Muy laxante': 'Muy laxante',
  }

  return {
    label: balanceResult.label,
    labelEs: labelEsMap[balanceResult.labelEs] ?? balanceResult.labelEs,
    severity: getBalanceSeverity(balanceResult.score),
    tip: getRandomTip(),
  }
}
