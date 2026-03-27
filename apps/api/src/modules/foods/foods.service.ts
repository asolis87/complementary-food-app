/**
 * Food service — business logic for the food catalog.
 * Spec: REQ-FD-01, REQ-FD-02
 */

import { FOOD_GROUP_LABELS } from '@cfa/shared'
import type { PrismaClient } from '@prisma/client'
import type { ListFoodsQuery } from './foods.schema.js'

export async function listFoods(prisma: PrismaClient, query: ListFoodsQuery) {
  const { q, group, alClassification, ageMonths, isAllergen, allergenFree, page, limit } = query

  const where = {
    // Text search on food name
    ...(q && {
      name: { contains: q, mode: 'insensitive' as const },
    }),
    // Food group filter
    ...(group && { group }),
    // A/L classification filter
    ...(alClassification && { alClassification }),
    // Age filter — only foods suitable for this age or younger
    ...(ageMonths !== undefined && { ageMonths: { lte: ageMonths } }),
    // Allergen boolean filter
    ...(isAllergen !== undefined && { isAllergen }),
    // Exclude allergens — foods that are allergens of the specified type
    ...(allergenFree && {
      NOT: {
        allergenType: {
          in: allergenFree.split(',').map((a) => a.trim()),
        },
      },
    }),
  }

  const skip = (page - 1) * limit

  const [foods, total] = await prisma.$transaction([
    prisma.food.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ name: 'asc' }],
    }),
    prisma.food.count({ where }),
  ])

  return {
    data: foods,
    total,
    page,
    limit,
  }
}

export async function getFoodById(prisma: PrismaClient, id: string) {
  return prisma.food.findUnique({ where: { id } })
}

/**
 * Quick search — top 10 foods by name similarity.
 * Used for autocomplete in the plate builder.
 */
export async function searchFoods(prisma: PrismaClient, query: string) {
  return prisma.food.findMany({
    where: {
      name: { contains: query, mode: 'insensitive' },
    },
    take: 10,
    orderBy: [{ name: 'asc' }],
    select: {
      id: true,
      name: true,
      group: true,
      alClassification: true,
      ageMonths: true,
      isAllergen: true,
      allergenType: true,
    },
  })
}

/**
 * Returns available food groups with Spanish labels from shared constants.
 */
export function getFoodGroups() {
  const groups = Object.entries(FOOD_GROUP_LABELS).map(([value, label]) => ({
    value,
    label,
  }))
  return { groups }
}
