/**
 * Snacks service — business logic for snack catalog management.
 * Mirrors the plates service structure but without balance scoring.
 * REQ-SM2: Create snack via manual per-group selection.
 * REQ-SM3: List snacks ("Mis Colaciones").
 */

import type { PrismaClient } from '@prisma/client'
import { TierLimitError } from '../../shared/errors/index.js'
import type { CreateSnackInput, ListSnacksQuery } from './snack.schemas.js'

const SNACK_LIMITS = { FREE: 5, PRO: Infinity }

/**
 * Get all snacks for a user, with optional filters for babyProfileId and stageFor.
 * Soft-deleted snacks are excluded.
 */
export async function getUserSnacks(
  prisma: PrismaClient,
  userId: string,
  query: ListSnacksQuery,
) {
  const { page, limit, babyProfileId, stageFor } = query
  const skip = (page - 1) * limit

  const where = {
    userId,
    deletedAt: null,
    ...(babyProfileId !== undefined && { babyProfileId }),
    ...(stageFor !== undefined && { stageFor }),
  }

  // Contract: snacks MUST be sorted by createdAt descending so the UI
  // can unshift new snacks at the top without re-fetching (mirrors plates).
  const [snacks, total] = await prisma.$transaction([
    prisma.snack.findMany({
      where,
      include: { items: { include: { food: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.snack.count({ where }),
  ])

  return { data: snacks, total, page, limit }
}

/**
 * Get a single snack by ID.
 * Returns null if not found or not owned by the user.
 */
export async function getSnackById(prisma: PrismaClient, id: string, userId: string) {
  return prisma.snack.findFirst({
    where: { id, userId, deletedAt: null },
    include: { items: { include: { food: true } } },
  })
}

/**
 * Create a new snack for the user.
 * Enforces tier limits: FREE users can have max 5 snacks, PRO users unlimited.
 * No balance calculation (snacks don't have A/L scoring).
 */
export async function createSnack(
  prisma: PrismaClient,
  userId: string,
  tier: 'FREE' | 'PRO',
  input: CreateSnackInput,
) {
  // Enforce snack cap for Free tier
  if (tier === 'FREE') {
    const count = await prisma.snack.count({ where: { userId, deletedAt: null } })
    if (count >= SNACK_LIMITS.FREE) {
      throw new TierLimitError(
        `Has alcanzado el límite de ${SNACK_LIMITS.FREE} colaciones para el plan gratuito. ` +
          'Mejora a Pro para colaciones ilimitadas.',
      )
    }
  }

  return prisma.snack.create({
    data: {
      userId,
      name: input.name ?? 'Mi colación',
      babyProfileId: input.babyProfileId,
      stageFor: input.stageFor,
      items: {
        create: input.items.map((item) => ({
          foodId: item.foodId,
          groupAssignment: item.groupAssignment,
          servingAmount: item.servingAmount,
        })),
      },
    },
    include: { items: { include: { food: true } } },
  })
}

/**
 * Soft-delete a snack.
 * Returns null if not found or not owned by the user.
 */
export async function softDeleteSnack(prisma: PrismaClient, id: string, userId: string) {
  const existing = await prisma.snack.findFirst({ where: { id, userId, deletedAt: null } })
  if (!existing) return null

  return prisma.snack.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
}
