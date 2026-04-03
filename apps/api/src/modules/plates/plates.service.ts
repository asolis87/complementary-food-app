/**
 * Plates service — business logic for the plate builder.
 * Spec: REQ-PB-01, REQ-PB-02
 * Design: AD11 (tier enforcement), AD12 (soft delete)
 */

import { calculateBalance } from '@pakulab/shared'
import type { BalanceResult } from '@pakulab/shared'
import type { PrismaClient } from '@prisma/client'
import { TierLimitError } from '../../shared/errors/index.js'
import type { CalculateBalanceInput, CreatePlateInput, ListPlatesQuery, UpdatePlateInput } from './plates.schema.js'

const PLATE_LIMITS = { FREE: 5, PRO: Infinity }

/**
 * Calculate A/L balance from a list of foodIds by fetching their classifications from DB.
 * This is the CORE function used by the anonymous calculate-balance endpoint.
 */
export async function calculatePlateBalance(
  prisma: PrismaClient,
  input: CalculateBalanceInput,
): Promise<BalanceResult & { foodsNotFound: string[] }> {
  const foodIds = input.items.map((i) => i.foodId)

  const foods = await prisma.food.findMany({
    where: { id: { in: foodIds } },
    select: { id: true, alClassification: true },
  })

  const foundIds = new Set(foods.map((f) => f.id))
  const foodsNotFound = foodIds.filter((id) => !foundIds.has(id))

  const itemsForBalance = foods.map((f) => ({
    alClassification: f.alClassification as 'ASTRINGENT' | 'LAXATIVE' | 'NEUTRAL',
  }))

  const balance = calculateBalance(itemsForBalance)

  return { ...balance, foodsNotFound }
}

export async function getUserPlates(
  prisma: PrismaClient,
  userId: string,
  query: ListPlatesQuery,
) {
  const { page, limit } = query
  const skip = (page - 1) * limit

  const where = { userId, deletedAt: null }

  const [plates, total] = await prisma.$transaction([
    prisma.plate.findMany({
      where,
      include: { items: { include: { food: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.plate.count({ where }),
  ])

  return { data: plates, total, page, limit }
}

export async function getPlateById(prisma: PrismaClient, id: string, userId: string) {
  return prisma.plate.findFirst({
    where: { id, userId, deletedAt: null },
    include: { items: { include: { food: true } } },
  })
}

export async function createPlate(
  prisma: PrismaClient,
  userId: string,
  tier: 'FREE' | 'PRO',
  input: CreatePlateInput,
) {
  // Enforce plate cap for Free tier
  if (tier === 'FREE') {
    const count = await prisma.plate.count({ where: { userId, deletedAt: null } })
    if (count >= PLATE_LIMITS.FREE) {
      throw new TierLimitError(
        `Has alcanzado el límite de ${PLATE_LIMITS.FREE} platos para el plan gratuito. ` +
          'Mejora a Pro para platos ilimitados.',
      )
    }
  }

  // Fetch foods to calculate balance using alClassification
  const foodIds = input.items.map((i) => i.foodId)
  const foods = await prisma.food.findMany({
    where: { id: { in: foodIds } },
    select: { id: true, alClassification: true },
  })

  // Map food A/L classifications for balance calculation
  const foodEffectMap = new Map(foods.map((f) => [f.id, f.alClassification]))
  const itemsForBalance = input.items.map((item) => ({
    alClassification: (foodEffectMap.get(item.foodId) ?? 'NEUTRAL') as
      | 'ASTRINGENT'
      | 'LAXATIVE'
      | 'NEUTRAL',
  }))

  const balance = calculateBalance(itemsForBalance)

  return prisma.plate.create({
    data: {
      userId,
      name: input.name,
      groupCount: input.groupCount,
      babyProfileId: input.babyProfileId,
      balanceScore: balance.score,
      astringentCount: balance.astringent,
      laxativeCount: balance.laxative,
      neutralCount: balance.neutral,
      items: {
        create: input.items.map((item) => ({
          foodId: item.foodId,
          groupAssignment: item.groupAssignment,
        })),
      },
    },
    include: { items: { include: { food: true } } },
  })
}

export async function updatePlate(
  prisma: PrismaClient,
  id: string,
  userId: string,
  input: UpdatePlateInput,
) {
  // Verify ownership
  const existing = await prisma.plate.findFirst({ where: { id, userId, deletedAt: null } })
  if (!existing) return null

  // If items changed, recalculate balance
  let balanceData: Record<string, number> = {}
  if (input.items) {
    const foodIds = input.items.map((i) => i.foodId)
    const foods = await prisma.food.findMany({
      where: { id: { in: foodIds } },
      select: { id: true, alClassification: true },
    })
    const foodEffectMap = new Map(foods.map((f) => [f.id, f.alClassification]))
    const itemsForBalance = input.items.map((item) => ({
      alClassification: (foodEffectMap.get(item.foodId) ?? 'NEUTRAL') as
        | 'ASTRINGENT'
        | 'LAXATIVE'
        | 'NEUTRAL',
    }))
    const balance = calculateBalance(itemsForBalance)
    balanceData = {
      balanceScore: balance.score,
      astringentCount: balance.astringent,
      laxativeCount: balance.laxative,
      neutralCount: balance.neutral,
    }
  }

  return prisma.plate.update({
    where: { id },
    data: {
      ...(input.name && { name: input.name }),
      ...(input.groupCount && { groupCount: input.groupCount }),
      ...('babyProfileId' in input && { babyProfileId: input.babyProfileId }),
      ...balanceData,
      ...(input.items && {
        items: {
          deleteMany: {},
          create: input.items.map((item) => ({
            foodId: item.foodId,
            groupAssignment: item.groupAssignment,
          })),
        },
      }),
    },
    include: { items: { include: { food: true } } },
  })
}

export async function softDeletePlate(prisma: PrismaClient, id: string, userId: string) {
  const existing = await prisma.plate.findFirst({ where: { id, userId, deletedAt: null } })
  if (!existing) return null

  return prisma.plate.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
}
